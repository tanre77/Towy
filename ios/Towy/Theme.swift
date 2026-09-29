import SwiftUI
import UIKit

enum TowyColor {
    static let asphalt = Color(red: 14 / 255, green: 16 / 255, blue: 20 / 255)
    static let surface = Color(red: 23 / 255, green: 26 / 255, blue: 32 / 255)
    static let paper = Color(red: 242 / 255, green: 244 / 255, blue: 246 / 255)
    static let steel = Color(red: 197 / 255, green: 208 / 255, blue: 220 / 255)
    static let muted = Color(red: 154 / 255, green: 163 / 255, blue: 174 / 255)
    static let subtle = Color(red: 109 / 255, green: 118 / 255, blue: 130 / 255)
    static let line = Color(red: 44 / 255, green: 51 / 255, blue: 60 / 255)
    static let ink = Color(red: 18 / 255, green: 20 / 255, blue: 24 / 255)
}

struct HookMark: View {
    var body: some View {
        Canvas { context, size in
            var path = Path()
            let sx = size.width / 32
            let sy = size.height / 32
            path.move(to: CGPoint(x: 4 * sx, y: 8 * sy))
            path.addLine(to: CGPoint(x: 22 * sx, y: 8 * sy))
            path.move(to: CGPoint(x: 22 * sx, y: 8 * sy))
            path.addLine(to: CGPoint(x: 22 * sx, y: 16 * sy))
            path.addCurve(
                to: CGPoint(x: 10 * sx, y: 16 * sy),
                control1: CGPoint(x: 22 * sx, y: 24 * sy),
                control2: CGPoint(x: 10 * sx, y: 24 * sy)
            )
            context.stroke(path, with: .color(TowyColor.paper), style: StrokeStyle(lineWidth: 2.4 * sx, lineCap: .round))
        }
        .frame(width: 28, height: 28)
        .accessibilityHidden(true)
    }
}

struct PrimaryButton: View {
    var title: String
    var disabled = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.body.weight(.medium))
                .frame(maxWidth: .infinity)
                .frame(minHeight: 48)
                .foregroundStyle(TowyColor.ink)
                .background(TowyColor.steel, in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .opacity(disabled ? 0.4 : 1)
    }
}

struct LineButton: View {
    var title: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.body.weight(.medium))
                .frame(maxWidth: .infinity)
                .frame(minHeight: 48)
                .foregroundStyle(TowyColor.paper)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(TowyColor.line, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

struct ChoiceRow: View {
    var title: String
    var detail: String? = nil
    var selected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .center, spacing: 12) {
                Rectangle()
                    .fill(selected ? TowyColor.paper : TowyColor.line)
                    .frame(width: 2, height: 16)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).foregroundStyle(selected ? TowyColor.paper : TowyColor.muted)
                    if let detail {
                        Text(detail).font(.subheadline).foregroundStyle(TowyColor.muted)
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

struct FieldLabel: View {
    var title: String
    var body: some View {
        Text(title).font(.subheadline).foregroundStyle(TowyColor.muted)
    }
}

struct UnderlineField: View {
    var text: Binding<String>
    var keyboard: UIKeyboardType = .default
    var body: some View {
        TextField("", text: text)
            .keyboardType(keyboard)
            .textInputAutocapitalization(keyboard == .phonePad || keyboard == .numberPad ? .never : .words)
            .foregroundStyle(TowyColor.paper)
            .padding(.vertical, 10)
            .overlay(alignment: .bottom) { Rectangle().fill(TowyColor.line).frame(height: 1) }
    }
}

struct SplitList: View {
    var quote: Quote
    var body: some View {
        VStack(spacing: 0) {
            row("Tow", TowyMath.usd(quote.total), strong: false)
            row("Insurance", TowyMath.usd(quote.covered), strong: false)
            row("Your share", TowyMath.usd(quote.driverPays), strong: true)
            row("Towy 6%", TowyMath.usd(quote.towyFee), strong: true)
            row("Yard", TowyMath.usd(quote.operatorReceives), strong: false)
        }
    }

    private func row(_ label: String, _ value: String, strong: Bool) -> some View {
        HStack {
            Text(label).foregroundStyle(strong ? TowyColor.paper : TowyColor.muted)
            Spacer()
            Text(value).monospacedDigit().foregroundStyle(strong ? TowyColor.paper : TowyColor.muted).fontWeight(strong ? .medium : .regular)
        }
        .font(.subheadline)
        .padding(.vertical, 8)
        .overlay(alignment: .top) { Rectangle().fill(TowyColor.line).frame(height: 1) }
    }
}
