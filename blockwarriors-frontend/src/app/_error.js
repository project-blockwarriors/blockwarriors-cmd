import React from 'react';
import Error from 'next/error';

const CustomError = ({ statusCode }) => {
    return (
        <Error statusCode={statusCode} />
    );
}

export default CustomError;
