// function that makes the api call to the server at address https://localhost:44387/api with GET, POST, PUT, DELETE methods
// and returns the response from the server
const API_URL = import.meta.env.VITE_API_URL;

async function get(url) {
    return fetch(API_URL + url).then((response) => response.json());
}

async function post(url, data, json) {
    return fetch(API_URL + url, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then((response) => {
        if(response.statusCode === 400)
        {
            throw response.value;
        } else if (json) {
            return response.json();
        }
        return response;
    });
}

async function patch(url, data, json) {
    return fetch(API_URL + url, {
        method: "PATCH",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then((response) => {
        if(response.statusCode === 400 || response.statusCode === 401)
        {
            throw response.value;
        } else if (json) {
            return response.json();
        }
        return response;
    });
}

async function put(url, data, json) {
    return fetch(API_URL + url, {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then((response) => {
        if(response.statusCode === 400 || response.statusCode === 401)
        {
            throw response.value;
        } else if (json) {
            return response.json();
        }
        return response;
    });
}

async function deleteData(url, json) {
    console.log(API_URL + url);
    const response = await fetch(API_URL + url, {
        method: "DELETE",
    });

    if (json) {
        const data = await response.json();
        return { status: response.status, data };
    } else {
        return { status: response.status };
    }
}

export default {
    get,
    post,
    patch,
    put,
    deleteData
};