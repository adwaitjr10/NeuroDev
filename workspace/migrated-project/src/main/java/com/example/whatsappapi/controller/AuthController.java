```java
package com.example.whatsappapi.controller;

import com.example.whatsappapi.model.User;
import com.example.whatsappapi.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class AuthController {

    private final UserService userService;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    public AuthController(UserService userService, BCryptPasswordEncoder bCryptPasswordEncoder) {
        this.userService = userService;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
    }

    @PostMapping("/sign-up")
    public ResponseEntity<?> signUp(@RequestBody User user) {
        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
        userService.saveUser(user);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }
}
```