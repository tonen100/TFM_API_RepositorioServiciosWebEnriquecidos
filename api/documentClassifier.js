"use strict";

var stopWords = require('stopwords').english;
var stemmer = require('porter-stemmer').stemmer;
var nb2words = require('number-to-words');

function tokenize(data) {
    var token_regex = /[0-9A-Za-z\u00C0-\u017F']+/g;
    var tokens = (data + "").match(token_regex);
    return tokens ? tokens : [];
}

function remove_stop_words(data) {
    return tokenize(data).filter(word =>
        stopWords.find(stopWord => stopWord == word) == null
        && word.length > 1
    ).join(' ');
}

function remove_punctuation(data) {
    var symbols = /[!\"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\n]/;
    data = data.replace(symbols, ' ');
    data = data.replace(/\ \ +/g, ' ');
    return data;
}

function remove_apostrophe(data) {
    return data.replace("'", "");
}

function convert_numbers(data) {
    var regex_cardinals = /^[0-9]+?(\.?)[0-9]*$/;
    var regex_ordinals = /^([0-9])+(st|nd|rd|th)$/;
    return tokenize(data).map(token => {
        token = token.replace(regex_ordinals, (substring, p1) => nb2words.toWordsOrdinal(p1))
        return token.replace(regex_cardinals, (substring) => nb2words.toWords(substring))
    }).join(' ');
}

function stemming(data) {
    return tokenize(data)
    .map(word => stemmer(word))
    .join(' ');
}

function preprocess(data) {
    data = data.toLowerCase();
    data = remove_punctuation(data);
    data = remove_apostrophe(data);
    data = remove_stop_words(data);
    data = convert_numbers(data);
    data = stemming(data);
    data = remove_punctuation(data);
    data = convert_numbers(data);
    data = stemming(data);
    data = remove_punctuation(data);
    return data.split(" ");
}

function computeDF(keyword, tokensList) {
    var DF = 0;
    tokensList.forEach(tokens => {
        if(tokens.find(token => keyword == token) != null) {
            DF++;
        }
    });
    return DF;
}

var occurrencesCount = function (str, array) {
    return array.filter(v => str == v).length
};

// tf-idf(t, d) = tf(t, d) * log(N/(df + 1))
function computeTF_IDFs(keyword, tokensList) {
    var DF = computeDF(keyword, tokensList);
    return tokensList.map(tokens => (occurrencesCount(keyword, tokens) / tokens.length) * Math.log(tokens.length / (DF + 1)));
}

function computeMatchingScores(restApis, textList, keywords, attributeName) {
    var tokensList = textList.map(text => preprocess(text));
    var TF_IDFs = keywords.map(keyword => computeTF_IDFs(keyword, tokensList));
    tokensList.forEach((_, i) => restApis[i]["avg_matching_score_" + attributeName] = keywords.map((_, j) => TF_IDFs[j][i]).reduce((a,b) => a + b, 0) / keywords.length);
}

function aggregateScores(restApi) {
    restApi.avg_matching_score = 
        restApi.avg_matching_score_name / 3 +
        restApi.avg_matching_score_categories / 6 +
        restApi.avg_matching_score_all / 2;
    delete restApi.avg_matching_score_name;
    delete restApi.avg_matching_score_categories;
    delete restApi.avg_matching_score_all;
}

function rankRestApis(keywords, restApis) {
    keywords = keywords.split(' ').map(keyword => stemmer(keyword));
    var restApisNames = restApis.map(restApi => restApi.metadata.name ? restApi.metadata.name : '');
    var restApisCategories = restApis.map(restApi => restApi.metadata.category != null ? typeof(restApi.metadata.category) == 'string' ? restApi.metadata.category : restApi.metadata.category.join(' ') : '');
    var restApisText = restApis.map(
        restApi => restApi.metadata.name + " " + restApi.metadata.description + " " +
        (restApi.metadata.category != null ? typeof(restApi.metadata.category) == 'string' ? restApi.metadata.category : restApi.metadata.category.join(' ') : '') + " " +
        (restApi.metadata.brand != null ? restApi.metadata.brand.name : '') + " " +
        (restApi.metadata.availableChannel == null || restApi.metadata.availableChannel.length == 0 ? "" : " " + restApi.metadata.availableChannel.map(
            channel => channel.name + channel.description + " " + channel.disambiguatingDescription + (channel.potentialAction == null || channel.potentialAction.length == 0 ? "" : " " + channel.potentialAction.map(
                action => action.target ? action.target.name + " " + action.target.description + " " + action.target.disambiguatingDescription : ''
            ).join(' '))
        ).join(' '))
    );
    computeMatchingScores(restApis, restApisNames, keywords, "name");
    computeMatchingScores(restApis, restApisCategories, keywords, "categories");
    computeMatchingScores(restApis, restApisText, keywords, "all");
    restApis.forEach(restApi => aggregateScores(restApi));
    return restApis.sort((a, b) => b.avg_matching_score - a.avg_matching_score);
}

module.exports = { remove_stop_words, remove_punctuation, rankRestApis }