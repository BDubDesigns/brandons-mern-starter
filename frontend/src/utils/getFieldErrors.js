export function getFieldErrors(field, errors) {
    // If errors is undefined, return undefined
    if (!errors)
        return undefined;
    // Filter to find errors which match the given field
    const fieldErrors = errors.filter((error) => {
        return error.path === field;
    });
    // Only return the error messages
    const messages = fieldErrors.map((error) => error.msg);
    return messages.length > 0 ? messages : undefined;
}
