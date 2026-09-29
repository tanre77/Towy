import SwiftUI

struct ShellView: View {
    @EnvironmentObject private var desk: Desk

    private var kicker: String {
        switch desk.screen {
        case .home: "Columbus"
        case .intake: "\(desk.step + 1) / 4"
        case .calling: "Calling"
        case .quotes: "Estimates"
        case .job: "Stop"
        case .insurer: "Insurers"
        case .partner: "Shops"
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            Group {
                switch desk.screen {
                case .home: HomeView()
                case .intake: IntakeView()
                case .calling: CallingView()
                case .quotes: QuotesView()
                case .job: JobView()
                case .insurer: InsurerView()
                case .partner: OperatorView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .padding(.horizontal, 20)
        .background(TowyColor.asphalt.ignoresSafeArea())
        .foregroundStyle(TowyColor.paper)
    }

    private var header: some View {
        HStack {
            HStack(spacing: 4) {
                if desk.screen != .home {
                    Button(action: desk.back) {
                        Image(systemName: "arrow.left")
                            .font(.body)
                            .frame(width: 44, height: 44)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Back")
                }
                Button {
                    desk.setScreen(.home)
                } label: {
                    HStack(spacing: 8) {
                        HookMark()
                        Text("shoulder").font(.body.weight(.semibold))
                    }
                }
                .buttonStyle(.plain)
            }
            Spacer()
            Text(kicker).font(.subheadline).foregroundStyle(TowyColor.muted)
        }
        .padding(.bottom, 12)
    }
}
