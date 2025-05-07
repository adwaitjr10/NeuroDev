```java
package com.example.whatsappapi.controller;

import com.example.whatsappapi.model.Token;
import com.example.whatsappapi.service.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tokens")
public class TokenController {

    private final TokenService tokenService;

    public TokenController(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @PostMapping
    public ResponseEntity<Token> createToken(@RequestBody Token token) {
        return new ResponseEntity<>(tokenService.saveToken(token), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Token>> getAllTokens() {
        return new ResponseEntity<>(tokenService.findAllTokens(), HttpStatus.OK);
    }

    @DeleteMapping("/{phone}")
    public ResponseEntity<HttpStatus> deleteToken(@PathVariable String phone) {
        tokenService.deleteToken(phone);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
```