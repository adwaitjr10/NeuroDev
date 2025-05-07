```java
package com.example.whatsappapi.repository;

import com.example.whatsappapi.model.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TokenRepository extends JpaRepository<Token, String> {
    Optional<Token> findByPhone(String phone);
    void deleteByPhone(String phone);
}
```