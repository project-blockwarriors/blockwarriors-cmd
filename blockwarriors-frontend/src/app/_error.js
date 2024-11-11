import React from 'react';
import Error from 'next/error';

const Error = ({ statusCode }) => {
    return (
        <Error statusCode={statusCode}></Error>
    );
}

export default Error;
