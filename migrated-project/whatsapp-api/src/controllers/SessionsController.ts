Filename: SessionsController.auto

import model "whatsapp-api/src/models/User"
import service "whatsapp-api/src/services/AuthenticateUserService"
import error "whatsapp-api/src/errors/AppError"

class SessionsController {
    public async create(request) {
        username = request.body.username
        password = request.body.password

        if (!username || !password) {
            throw error.AppError("Username and password are required", 400)
        }

        try {
            authenticateUser = service.AuthenticateUserService()

            result = await authenticateUser.execute(username, password)
            user = result.user
            token = result.token
            expires = result.expires

            userWithoutKey = {
                id: user.id,
                name: user.username
            }

            return response(200, {user: userWithoutKey, token, expires})
        } catch (err) {
            if (err instanceof error.AppError) {
                throw err
            }
            throw error.AppError("Authentication failed", 401)
        }
    }
}