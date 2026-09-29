import PassKit
import UIKit

enum ApplePay {
    static let merchantID = "merchant.com.towy.dispatch"

    static func present(amount: Double, completion: @escaping (Bool) -> Void) {
        let request = PKPaymentRequest()
        request.merchantIdentifier = merchantID
        request.countryCode = "US"
        request.currencyCode = "USD"
        request.supportedNetworks = [.visa, .masterCard, .amex, .discover]
        request.merchantCapabilities = .threeDSecure
        let share = NSDecimalNumber(value: amount)
        request.paymentSummaryItems = [
            PKPaymentSummaryItem(label: "Your share of the service", amount: share),
            PKPaymentSummaryItem(label: "shoulder", amount: share),
        ]

        guard PKPaymentAuthorizationViewController.canMakePayments(usingNetworks: request.supportedNetworks),
              let controller = PKPaymentAuthorizationViewController(paymentRequest: request),
              let presenter = topController() else {
            completion(false)
            return
        }

        let delegate = Delegate { success in
            Holder.delegate = nil
            completion(success)
        }
        Holder.delegate = delegate
        controller.delegate = delegate
        presenter.present(controller, animated: true)
    }

    private static func topController() -> UIViewController? {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let root = scenes.flatMap(\.windows).first(where: \.isKeyWindow)?.rootViewController
        var current = root
        while let presented = current?.presentedViewController {
            current = presented
        }
        return current
    }

    private enum Holder {
        static var delegate: Delegate?
    }

    private final class Delegate: NSObject, PKPaymentAuthorizationViewControllerDelegate {
        let finish: (Bool) -> Void
        private var paid = false

        init(finish: @escaping (Bool) -> Void) {
            self.finish = finish
        }

        func paymentAuthorizationViewControllerDidFinish(_ controller: PKPaymentAuthorizationViewController) {
            controller.dismiss(animated: true) {
                self.finish(self.paid)
            }
        }

        func paymentAuthorizationViewController(
            _ controller: PKPaymentAuthorizationViewController,
            didAuthorizePayment payment: PKPayment,
            handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
        ) {
            paid = true
            completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
        }
    }
}
