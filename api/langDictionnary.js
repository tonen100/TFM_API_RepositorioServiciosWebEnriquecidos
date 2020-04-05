'use strict';

const DEFAULT_ENTRIES = [
    {
        id: 'RessourceNotFound',
        values: [
            {
                lang: 'en',
                text: (args) => 'There is no ' + args[0] + ' with id ' + args[1]
            }, {
                lang: 'es',
                text: (args) => 'No hay ' + args[0] + ' con el id ' + args[1]
            }, 
        ]
    }, {
        id: 'MissingParameter',
        values: [
            {
                lang: 'en',
                text: (args) => 'The parameter ' + args[0] + ' is missing in the request'
            }, {
                lang: 'es',
                text: (args) => 'Falta el parametro ' + args[0] + ' en la petición'
            }, 
        ]
    }, {
        id: 'MissingBody',
        values: [
            {
                lang: 'en',
                text: (args) => 'The request body is invalid : expected a ' + args[0] + ' object'
            }, {
                lang: 'es',
                text: (args) => 'El cuerpo de la petición esta incorrecto: se esperaba un objeto ' + args[0]
            }, 
        ]
    }, {
        id: 'ErrorGetDB',
        values: [
            {
                lang: 'en',
                text: 'An unknown error occured while getting data from DB'
            }, {
                lang: 'es',
                text: 'Un error desconocido ha ocurido recuperando datos en la base de datos'
            }, 
        ]
    }, {
        id: 'ErrorCreateDB',
        values: [
            {
                lang: 'en',
                text: 'An unknown error occured while creating data in DB'
            }, {
                lang: 'es',
                text: 'Un error desconocido ha ocurido creando un recurso en la base de datos'
            }, 
        ]
    }, {
        id: 'ErrorUpdateDB',
        values: [
            {
                lang: 'en',
                text: 'An unknown error occured while updating data in DB'
            }, {
                lang: 'es',
                text: 'Un error desconocido ha ocurido actualizando datos en la base de datos'
            }, 
        ]
    }, {
        id: 'ErrorDeleteDB',
        values: [
            {
                lang: 'en',
                text: 'An unknown error occured while deleting data in DB'
            }, {
                lang: 'es',
                text: 'Un error desconocido ha ocurido suprimiendo un dato en la base de datos'
            }, 
        ]
    }, {
        id: 'ErrorSchema',
        values: [
            {
                lang: 'en',
                text: 'Schema validation error: the entity doesn\'t respect constraints'
            }, {
                lang: 'es',
                text: 'Error de validación del esquema: la entidad no esta valida'
            }, 
        ]
    }, {
        id: 'Forbidden',
        values: [
            {
                lang: 'en',
                text: 'Forbidden'
            }, {
                lang: 'es',
                text: 'Prohibido'
            }, 
        ]
    }, {
        id: 'Unauthorized',
        values: [
            {
                lang: 'en',
                text: 'Unauthorized'
            }, {
                lang: 'es',
                text: 'No autorizado'
            }, 
        ]
    }, {
        id: 'AlreadyCancelled',
        values: [
            {
                lang: 'en',
                text: 'Trip (already) cancelled'
            }, {
                lang: 'es',
                text: 'Viaje (ya) cancelado'
            }, 
        ]
    }, {
        id: 'PreconditionFailed',
        values: [
            {
                lang: 'en',
                text: 'Precondition Failed'
            }, {
                lang: 'es',
                text: 'La condición previa falló'
            }, 
        ]
    }, {
        id: 'ErrorVersionNumberAlreadyUsed',
        values: [
            {
                lang: 'en',
                text: number => 'The API already use the ' + number + ' version number'
            }, {
                lang: 'es',
                text: 'La API ya utiliza este numero de versión'
            },
        ]
    }

];

module.exports = class LangDictionnary {
    constructor(entries) {
        this.dict = new Map();
        DEFAULT_ENTRIES.forEach(
            entry => entry.values.forEach(
                phrase => this.dict.set(entry.id + "/" + phrase.lang, phrase.text)
            )
        );
        if(entries != null) {
            entries.forEach(
                entry => entry.values.forEach(
                    phrase => this.dict.set(entry.id + "/" + phrase.lang, phrase.text)
                )
            );
        }
    }

    get LANGUAGES() {
        return {
            en: 'en',
            es: 'es'
        }
    }

    get DEFAULT_LANG() {
        return 'en';
    }

    set(entry) {
        entry.values.forEach(
            phrase => this.dict.set(entry.id + "/" + phrase.lang, phrase.text)
        )
    }

    get(id, lang, ...args) {
        var value = this.dict.get(id + "/" + lang)
        if(value == null) value = this.dict.get(id + "/" + this.DEFAULT_LANG)
        return args.length > 0 && value != null ? value(args) : value;
    }

    getLang(req) {
        return req.headers['accept-language'] ? req.headers['accept-language'].slice(0, 2) : this.DEFAULT_LANG;
    }
}