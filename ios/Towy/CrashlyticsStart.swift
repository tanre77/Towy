import Foundation

#if canImport(FirebaseCore)
import FirebaseCore
import FirebaseCrashlytics
#endif

enum CrashlyticsStart {
    static func start() {
        #if canImport(FirebaseCore)
        guard
            let url = Bundle.main.url(forResource: "GoogleService-Info", withExtension: "plist"),
            let plist = NSDictionary(contentsOf: url),
            let appId = plist["GOOGLE_APP_ID"] as? String,
            appId.contains(":")
        else { return }
        FirebaseApp.configure()
        #endif
    }
}
