```java
package com.example.whatsappapi.repository;

import com.example.whatsappapi.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByStatusAndScheduleDateLessThanEqualOrStatusAndScheduleDateIsNull(String status, LocalDateTime scheduleDate);
}
```