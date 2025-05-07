Filename: AppError.auto

class AppError {
    public readonly message: String
    public readonly statusCode: Int

    constructor(message: String, statusCode: Int = 400) {
        this.message = message
        this.statusCode = statusCode
    }
}

export default AppError