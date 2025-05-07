Filename: SeedAdminUser.auto
import database from 'data/db'
import User from 'models/User'

func seedAdminUser() {
    adminUser := User{
        Name: "Admin"
        Email: "admin@example.com"
        Password: "securePassword"
        Role: "admin"
    }

    db := database.connect()
    defer db.close()

    db.create(adminUser)
}

func main() {
    seedAdminUser()
}