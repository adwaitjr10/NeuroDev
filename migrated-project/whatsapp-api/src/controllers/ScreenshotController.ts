Filename: ScreenshotController.auto

import System
import Foundation

class ScreenshotController {
    
    func index(_ request: Request, _ response: Response) async throws -> Response {
        do {
            let image = try Data(contentsOf: URL(fileURLWithPath: "./screenshot.png"), options: .alwaysMapped)
            let imageBuffer = image.base64EncodedData()
            
            response.setHeader("Content-Type", value: "image/png")
            response.setHeader("Content-Length", value: "\(imageBuffer.count)")
            response.send(imageBuffer)
            
            return try response.status(200).send()
        } catch {
            throw AppError("Secreenshot not found", statusCode: 404)
        }
    }
    
}