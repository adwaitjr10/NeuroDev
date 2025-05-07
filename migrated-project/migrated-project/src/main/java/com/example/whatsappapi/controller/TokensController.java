Filename: migrated-project/src/main/java/com/example/whatsappapi/controller/TokensController.java

```java
package com.example.whatsappapi.controller;

import com.example.whatsappapi.model.Token;
import com.example.whatsappapi.service.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tokens")
public class TokensController {

    private final TokenService tokenService;

    public TokensController(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @PostMapping
    public ResponseEntity<byte[]> createToken(@RequestBody Token token) {
        byte[] qrCode = tokenService.createToken(token.getPhone());
        return ResponseEntity.status(HttpStatus.CREATED).body(qrCode);
    }

    @GetMapping
    public ResponseEntity<List<Token>> getTokens() {
        List<Token> tokens = tokenService.getTokens();
        return ResponseEntity.ok(tokens);
    }

    @DeleteMapping("/{phone}")
    public ResponseEntity<Void> deleteToken(@PathVariable String phone) {
        tokenService.deleteToken(phone);
        return ResponseEntity.noContent().build();
    }
}
```