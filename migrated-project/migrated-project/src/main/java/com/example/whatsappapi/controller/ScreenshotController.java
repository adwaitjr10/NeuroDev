Filename: migrated-project/src/main/java/com/example/whatsappapi/controller/ScreenshotController.java

```java
package com.example.whatsappapi.controller;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@RestController
@RequestMapping("/api/screenshot")
public class ScreenshotController {

    @GetMapping
    public ResponseEntity<Resource> getScreenshot() throws IOException {
        File file = new File("screenshot.png");
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        byte[] bytes = Files.readAllBytes(file.toPath());
        ByteArrayResource resource = new ByteArrayResource(bytes);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .body(resource);
    }
}
```