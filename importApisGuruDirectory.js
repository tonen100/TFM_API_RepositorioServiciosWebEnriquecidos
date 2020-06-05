#!usr/bin/env node
'use strict';

var yargs = require('yargs');
const firebase = require("firebase/app");
require("firebase/auth");
const request = require('request-promise-native').defaults({json: true});
const oas2schemaOrg = require('oas2schema.org');

const URL_APIS_GURU = "https://api.apis.guru/v2/list.json";
const URL_API_RESTAPIMANTICS = "http://localhost:8080/v1";
// const URL_API_RESTAPIMANTICS = "https://tfm-api-repositorio.herokuapp.com/v1";

// Some APIs on top of not beeing valid freeze the all process
const IGNORE_APIS = [
    'stripe.com'
]

let idToken;

function splitCamelCase(value) {
    return value
    // Inserts a space before all caps (for camelCase strings)
    .replace(/([A-Z][a-z]+)/g, ' $1')
    // Lowercases all characters (for camelCase strings)
    .toLowerCase()
    // Uppercases the first character (for camelCase strings)
    .replace(/^./, function(str){ return str.toUpperCase(); })
}

async function connect(credentials) {
    try {
        const user = await request.post(URL_API_RESTAPIMANTICS + "/login", { body: credentials });
        const fireAuth = firebase.initializeApp({
            apiKey: 'AIzaSyDLqZG0zNK1rZB7S_D_QVRI-KKDPmxNk8g',
            authDomain: 'tfm-api-repositorio.firebaseapp.com',
            databaseURL: 'https://tfm-api-repositorio.firebaseio.com',
            projectId: 'tfm-api-repositorio',
            storageBucket: 'tfm-api-repositorio.appspot.com',
            messagingSenderId: '86439804625',
            appId: '1:86439804625:web:167d40897d54d0baffcff0'
          }).auth();
          try {
            await fireAuth.signInWithCustomToken(user.customToken);
            return fireAuth.currentUser.getIdToken().catch(_2 => console.error('Firebase unknown error'));
          } catch(err) {
            throw new Error("Firebase unreachable (" + err + ")");
          }
    } catch(_) {
        throw new Error("FATAL ERROR: Invalid credentials");
    }
}

async function importAll(list) {
    console.log(Object.keys(list).length + " APIs to load")
    let i = 1;
    for(const apiId of Object.keys(list)) {
        if(IGNORE_APIS.includes(apiId)) {
            console.warn(i + ": " + apiId + " IGNORED (problematic API)");
        } else {
            const api = extractAPI(list[apiId]);
            if(!api) { console.error(i + ": " + apiId + " FAILED (no info API)"); }
            else {
                try {
                    const versions = await extractAPIVersions(list[apiId].versions);
                    if(versions.length == 0) console.error(i + ": " + apiId + " FAILED (no version could be extracted)");
                    else {
                        let newApi;
                        try {
                            if(apiId.endsWith('v2'))
                                newApi = await doV2Cases(api, versions, apiId.substring(0, apiId.length - 2));
                            else if(apiId.startsWith('azure.com') && apiId.match(/-[A-Za-z_]+$/))
                                newApi = await doAzureCases(api, versions, apiId.substring(apiId.lastIndexOf('-') + 1).toLocaleLowerCase());
                            else // Normal cases
                                newApi = await createApi(api, versions);
                            const initialVersionsNb = Object.keys(list[apiId].versions).length;
                            if(versions.length < initialVersionsNb) console.warn(`${i}: ${apiId} OK (but ${initialVersionsNb - versions.length}/${initialVersionsNb} failed to be extracted)`);
                            else console.log(i + ": " + apiId + " OK");
                        } catch(_) {
                            console.error(i + ": " + apiId + " FAILED (can't create API)")
                        }
                    }
                } catch(_) {
                    console.error(i + ": " + apiId + " FAILED (no version could be extracted)");
                }
            }
        }
        i++;
    }
}

async function doV2Cases(api, versions) {
    const response = await request.get(URL_API_RESTAPIMANTICS + "/restApis?name=" + api.name);
    if(response && response.length > 0) {
        const newApi = response[0];
        newApi.name = api.name;
        versions.sort((a, b) => a.date_creation.getTime() - b.date_creation.getTime()).forEach(async version => {
            delete version.date_creation;
            await createVersion(version, newApi);
        });
        return newApi;
    } else {
        return await createApi(api, versions);
    }
}

async function doAzureCases(api, versions, nameRessource) {
    api.name = splitCamelCase(api.name);
    if (!api.name.endsWith(nameRessource)) {
        api.name = api.name + " " + nameRessource;
    }
    return await createApi(api, versions);
}

async function createApi(api, versions) {
    const providerName = api.providerName;
    delete api.providerName;
    const newApi = await request.post(URL_API_RESTAPIMANTICS + "/restApis", {
        headers: {
            Authorization: 'Bearer ' + idToken
        },
        body: api
    });
    if(!newApi) {
        return;
    }
    await createAndLinkProvider(providerName, newApi);
    versions.sort((a, b) => a.date_creation.getTime() - b.date_creation.getTime()).forEach(async version => {
        delete version.date_creation;
        await createVersion(version, newApi);
    }); 
}

async function createAndLinkProvider(providerName, newApi) {
    let provider;
    await request.get(URL_API_RESTAPIMANTICS + "/providers?name=" + providerName).then(
        providers => {
            if(provider = providers.find(p => p.name === providerName)) {
                request.patch(URL_API_RESTAPIMANTICS + "/restApis/" + newApi._id +  "/link/" + provider._id, {
                    headers: {
                        Authorization: 'Bearer ' + idToken
                    }
                })
                .catch(_ => console.error("FAILED link existing provider " + providerName));
            } else {
                throw new Error();
            }
        }
    ).catch(_ => {
        provider = extractProvider(providerName, newApi);
        request.post(URL_API_RESTAPIMANTICS + "/providers", {
            headers: {
                Authorization: 'Bearer ' + idToken
            },
            body: provider
        }).then(newProvider =>
            request.patch(URL_API_RESTAPIMANTICS + "/restApis/" + newApi._id +  "/link/" + newProvider._id, {
                headers: {
                    Authorization: 'Bearer ' + idToken
                }
            })
            .catch(_ => console.error("FAILED link new provider " + providerName))
        ).catch(_ => console.error("FAILED create provider " + providerName));
    })
}

function createVersion(version, newApi) {
    return request.post(URL_API_RESTAPIMANTICS + "/restApis/" + newApi._id + "/versions", {
        headers: {
            Authorization: 'Bearer ' + idToken
        },
        body: version
    }).catch(_ =>  {
        console.error(newApi.name + " FAILED (version " + version.number + " failed to be created)");
    });
}

function extractAPI(apiGuruAPI) {
    const lastVersion = apiGuruAPI.versions[apiGuruAPI.preferred];
    if(!lastVersion) {
        return null;
    } else {
        const providerFullName = lastVersion.info['x-providerName'];
        return {
            name: lastVersion.info.title,
            logoUrl: lastVersion.info['x-logo'] ? lastVersion.info['x-logo'].url : null,
            providerName: providerFullName ? (
                providerFullName.lastIndexOf('.') > 0 ? providerFullName.substring(0,  providerFullName.lastIndexOf('.')) : providerFullName
                ) : null
        };
    }
}

function extractProvider(name, api) {
    return {
        name: name,
        logoUrl: api.logoUrl,
    };
}

async function extractAPIVersions(apiGuruVersions) {
    const versions = [];
    
    for(let number of Object.keys(apiGuruVersions)) {
        let doc = null;
        let docUrl = null;
        try {
            try {
                let docUrl = apiGuruVersions[number].info['x-origin'][0].url;
                doc = await request.get(docUrl);
                if(doc) {
                    await oas2schemaOrg.oasValidator.evaluateDocument(
                        await oasConverter.convertToOASv3(doc, oas2schemaOrg.oasConverter.extractFormat(doc))
                    );
                } else {
                    throw new Error();
                }
            } catch(err) {
                docUrl = apiGuruVersions[number].swaggerUrl ? apiGuruVersions[number].swaggerUrl : apiGuruVersions[number].swaggerYamlUrl;
                doc = await request.get(docUrl);
                if(doc) {
                    await oas2schemaOrg.oasValidator.evaluateDocument(
                        await oas2schemaOrg.oasConverter.convertToOASv3(doc, oas2schemaOrg.oasConverter.extractFormat(doc))
                    );
                } else {
                    throw new Error();
                }
            }
            versions.push({
                number: number,
                description: 'No description found',
                originalDocumentation: JSON.stringify(doc),
                urlDoc: docUrl,
                date_creation: new Date(apiGuruVersions[number].added)
            });
        } catch(err2) {
                    
        }
    }
    return versions; // Todas las versiones
    // return [versions.sort((a, b) => b.date_creation - a.date_creation)[0]]; // Unicamente la version la mas reciente
}

var argv = yargs
    .option('login', {
        alias: 'l',
        description: 'Login (email or username) of the account to use as creator of the APIs uploaded',
        type: 'string'
    })
    .option('password', {
        alias: 'p',
        description: 'Correspondind password',
        type: 'string'
    })
    .help()
    .alias('help', 'h')
    .showHelpOnFail(false, "Specify --help for available options")
    .argv;

if(argv.login && argv.password) {
    const login = argv.login;
    const password = argv.password;
    connect({
        login,
        password
    })
    .then(token => {
        idToken = token;
        request.get(URL_APIS_GURU).then(importAll).catch(err => console.error("apis.guru unreachable (" + err + ")"))
    }).catch(err2 => console.error(err2));
    
} else {
    yargs.showHelp();
}