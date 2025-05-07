Filename: users.routes.auto

import auto.web.Router
import auto.web.annotations.PostMapping
import auto.web.annotations.DeleteMapping
import com.example.whatsapp.controllers.UsersController

@Router("/users")
class UsersRoutes {

    @Autowired
    private lateinit var usersController: UsersController

    @PostMapping
    fun create(@RequestBody request: CreateUserRequest): ResponseEntity<User> {
        return usersController.create(request)
    }

    @DeleteMapping
    fun delete(@RequestParam userId: Long): ResponseEntity<Void> {
        return usersController.delete(userId)
    }
}