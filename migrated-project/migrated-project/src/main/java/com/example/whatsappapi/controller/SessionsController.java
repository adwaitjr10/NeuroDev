Filename: migrated-project/src/main/java/com/example/whatsappapi/controller/SessionsController.java

```java
package com.example.whatsappapi.controller;

import com.example.whatsappapi.model.User;
import com.example.whatsappapi.security.JWTTokenProvider;
import com.example.whatsappapi.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class SessionsController {

    private final AuthenticationManager authenticationManager;
    private final JWTTokenProvider jwtTokenProvider;
    private final UserService userService;

    public SessionsController(AuthenticationManager authenticationManager, JWTTokenProvider jwtTokenProvider, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> authenticate(@RequestBody User user) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername(),
                        user.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);
        User authenticatedUser = userService.loadUserByUsername(user.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("user", authenticatedUser);
        response.put("token", jwt);
        response.put("expires", jwtTokenProvider.getExpirationDate(jwt));

        return ResponseEntity.ok(response);
    }
}
```