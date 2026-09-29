import SwiftUI

@main
struct TowyApp: App {
    @StateObject private var desk = Desk()

    init() {
        CrashlyticsStart.start()
    }

    var body: some Scene {
        WindowGroup {
            ShellView()
                .environmentObject(desk)
                .preferredColorScheme(.dark)
        }
    }
}
