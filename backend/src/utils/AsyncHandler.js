const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error("Error details:", error); // Log the error details
        const statusCode = (typeof error.code === 'number' && error.code >= 100 && error.code <= 599) ? error.code : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
}

export { asyncHandler };