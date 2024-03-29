import {LOGOUT_SUCCESS} from "../../types/account/login";

/**
 * Created by Dupnder on 29/05/19.
 */

let Symbol = require('es6-symbol');

function getApi(endpoint, token) {
    // const token = localStorage.getItem('token');
    let config = {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${token}`,
            "Access-Control-Allow-Origin": "*",
            withCredentials: true,
            mode: 'no-cors'
        }
    };
    return fetch(endpoint, config)
        .then((response) => {
            if (response.status === 200) {
                return response.text().then(data => {
                    return isValidJSON(data) ? ({data: JSON.parse(data), status: response.status}) : ({
                        data: {
                            error: true,
                            message: "Error while parsing the json."
                        }, status: response.status
                    })
                })
            } else {
                return response.json().then(data =>
                    ({
                        data: (endpoint.match("/search/") && response.status === 404) ? {
                            error: false,
                            message: "Search details.",
                            search: []
                        } : data,
                        status: (endpoint.match("/search/") && response.status === 404) ? 200 : response.status
                    })
                )
            }
        })
        .catch(err => {
                return {
                    data: endpoint.match("/search/") ? {
                        error: false,
                        message: "Search details.",
                        search: []
                    } : {error: true, message: "Internal Server Error"},
                    status: endpoint.match("/search/") ? 200 : 500
                }
            }
        )
}

function isValidJSON(data) {
    try {
        JSON.parse(data);
    } catch (e) {
        return false
    }
    return true
}

export const GET_API = Symbol('Call API');

export default store => next => action => {
    const getAPI = action[GET_API];
    // So the middleware doesn't get applied to every single action
    if (typeof getAPI === 'undefined') {
        return next(action);
    }
    let {endpoint, types, token} = getAPI;
    const [requestType, successType, errorType] = types;
    return (next({type: requestType}), getApi(endpoint, token).then(
        response => {
            if (response.status === 403 || response.status === 401 || response.status === 404) {
                return next({
                    response,
                    type: LOGOUT_SUCCESS
                })
            }
            if (response.status === 200) {
                return next({
                    response,
                    type: successType
                })
            } else {
                return next({
                    response,
                    type: errorType
                })
            }
        }
    ))
}
