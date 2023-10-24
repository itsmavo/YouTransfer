export function htmlResponse (statusCode, text) {
    return {
        statusCode,
        body: `<html>${text}</html>`,
        header: {
            'Content-Type': 'text/html'
        },
    };
}

export function jsonResponse (statusCode, object) {
    return {
        statusCode,
        body: JSON.stringify(object),
        headers: {
            'Content-Type': 'application/json'
        },
    };
}