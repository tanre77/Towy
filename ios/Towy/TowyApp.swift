import SwiftUI

@main
struct TowyApp: App {
    @StateObject private var desk = Desk()

    var body: some Scene {
        WindowGroup {
            ShellView()
                .environmentObject(desk)
                .preferredColorScheme(.dark)
        }
    }
}
