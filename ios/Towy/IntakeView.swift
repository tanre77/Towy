import SwiftUI
import UIKit

struct IntakeView: View {
    @EnvironmentObject private var desk: Desk

    private var job: Job? { desk.active }

    var body: some View {
        Group {
            if let job {
                content(job)
            }
        }
    }

    private func content(_ job: Job) -> some View {
        let ready = !job.contactName.trimmingCharacters(in: .whitespaces).isEmpty && TowyMath.phoneOk(job.contactPhone) && TowyMath.vehicleOk(job.vehicle)
        let location = TowyMath.place(job.locationId)
        return ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if desk.step == 0 { vehicleStep(job) }
                if desk.step == 1 { situationStep(job) }
                if desk.step == 2 { locationStep(job, location) }
                if desk.step == 3 { coverageStep(job, location) }

                if desk.step < 3 {
                    PrimaryButton(title: "Continue", disabled: desk.step == 0 && !ready) {
                        desk.setStep(desk.step + 1)
                    }
                } else {
                    PrimaryButton(title: "Call the shops", disabled: !ready) {
                        desk.placeCalls()
                    }
                }
                if desk.step == 0 && !ready {
                    Text("Add a name and a 10-digit phone so the shop can call back.")
                        .font(.subheadline)
                        .foregroundStyle(TowyColor.subtle)
                }
            }
            .padding(.bottom, 32)
        }
    }

    private func vehicleStep(_ job: Job) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Vehicle").font(.title2.weight(.medium))
            FieldLabel(title: "Name")
            UnderlineField(text: Binding(
                get: { job.contactName },
                set: { desk.patchContact(name: $0) }
            ))
            FieldLabel(title: "Phone for the shop")
            UnderlineField(text: Binding(
                get: { job.contactPhone },
                set: { desk.patchContact(phone: $0) }
            ), keyboard: .phonePad)
            Text("Common vehicles").font(.subheadline.weight(.medium)).foregroundStyle(TowyColor.muted)
            FlowChoices(items: TowyMath.presets.map(\.0)) { label in
                ChoiceRow(title: label, selected: job.vehicle.model == TowyMath.presets.first { $0.0 == label }?.1.model && job.vehicle.year == TowyMath.presets.first { $0.0 == label }?.1.year) {
                    if let vehicle = TowyMath.presets.first(where: { $0.0 == label })?.1 {
                        desk.setPreset(vehicle)
                    }
                }
            }
            HStack(spacing: 12) {
                field("Year", job.vehicle.year, .numberPad) { value in desk.patchVehicle { $0.year = value } }
                field("Make", job.vehicle.make) { value in desk.patchVehicle { $0.make = value } }
                field("Model", job.vehicle.model) { value in desk.patchVehicle { $0.model = value } }
            }
            FieldLabel(title: "Tire size")
            UnderlineField(text: Binding(
                get: { job.vehicle.tires },
                set: { value in desk.patchVehicle { $0.tires = value } }
            ))
            Text("Drivetrain").font(.subheadline.weight(.medium)).foregroundStyle(TowyColor.muted)
            Picker("Drivetrain", selection: Binding(
                get: { job.vehicle.drivetrain },
                set: { value in desk.patchVehicle { $0.drivetrain = value } }
            )) {
                ForEach(Drivetrain.allCases, id: \.self) { drive in
                    Text(drive.rawValue).tag(drive)
                }
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            ChoiceRow(title: "Electric vehicle", selected: job.vehicle.ev) {
                desk.patchVehicle { $0.ev.toggle() }
            }
        }
    }

    private func situationStep(_ job: Job) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Situation").font(.title2.weight(.medium))
            yesNo("Can it start?", job.situation.starts) { desk.setStarts($0) }
            yesNo("Can it roll?", job.situation.rolls) { desk.setRolls($0) }
            Text("Where is it sitting?").font(.subheadline.weight(.medium)).foregroundStyle(TowyColor.muted)
            ForEach(Position.allCases, id: \.self) { position in
                ChoiceRow(title: TowyMath.positionLabel(position), selected: job.situation.position == position) {
                    desk.setPosition(position)
                }
            }
            Text("Which side?").font(.subheadline.weight(.medium)).foregroundStyle(TowyColor.muted)
            ForEach(Side.allCases, id: \.self) { side in
                ChoiceRow(title: TowyMath.sideLabel(side), selected: job.situation.side == side) {
                    desk.setSide(side)
                }
            }
            VStack(alignment: .leading, spacing: 8) {
                Text(TowyMath.equipmentLabel(job.situation.equipment)).font(.body.weight(.medium))
                Text(TowyMath.equipmentReason(job.vehicle, job.situation)).font(.subheadline).foregroundStyle(TowyColor.muted)
                Button("Use the recommendation") { desk.useRecommendations() }
                    .font(.subheadline)
                    .buttonStyle(.plain)
                ChoiceRow(title: "Wheel-lift", selected: job.situation.equipment == .wheelLift) { desk.setEquipment(.wheelLift) }
                ChoiceRow(title: "Flatbed", selected: job.situation.equipment == .flatbed) { desk.setEquipment(.flatbed) }
            }
            .padding(.top, 8)
            .overlay(alignment: .top) { Rectangle().fill(TowyColor.line).frame(height: 1) }
            ChoiceRow(title: "Fish it out", detail: TowyMath.winchReason(job.situation.position), selected: job.situation.winch) {
                desk.setWinch(!job.situation.winch)
            }
        }
    }

    private func locationStep(_ job: Job, _ location: Place) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Location").font(.title2.weight(.medium)).padding(.bottom, 8)
            ForEach(TowyMath.places) { place in
                Button {
                    desk.setLocation(place.id)
                } label: {
                    HStack(alignment: .firstTextBaseline, spacing: 16) {
                        Text(place.mile)
                            .font(.title2.weight(.medium))
                            .monospacedDigit()
                            .frame(width: 72, alignment: .leading)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(place.road) \(place.direction)")
                            Text("\(place.place) · \(TowyMath.trafficLabel(place.traffic))")
                                .font(.subheadline)
                                .foregroundStyle(TowyColor.muted)
                        }
                        Spacer()
                    }
                    .foregroundStyle(place.id == job.locationId ? TowyColor.paper : TowyColor.muted)
                    .padding(.vertical, 12)
                    .overlay(alignment: .top) { Rectangle().fill(TowyColor.line).frame(height: 1) }
                }
                .buttonStyle(.plain)
            }
            ChoiceRow(
                title: "Request an officer",
                detail: TowyMath.policeReason(job.situation.position, job.situation.side, location.traffic),
                selected: job.situation.police
            ) {
                desk.setPolice(!job.situation.police)
            }
            .padding(.top, 8)
        }
    }

    private func coverageStep(_ job: Job, _ location: Place) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Coverage").font(.title2.weight(.medium))
            Text("6% applies only after the policy pays.")
                .font(.subheadline)
                .foregroundStyle(TowyColor.muted)
                .padding(.bottom, 8)
            ForEach(Coverage.allCases, id: \.self) { coverage in
                ChoiceRow(title: TowyMath.coverageTitle(coverage), detail: TowyMath.coverageDetail(coverage), selected: job.coverage == coverage) {
                    desk.setCoverage(coverage)
                }
                .disabled(job.coverageLocked && job.coverage != coverage)
            }
            if job.coverageLocked {
                Text("Harbor Mutual locked this member to roadside assist.")
                    .font(.subheadline)
                    .foregroundStyle(TowyColor.muted)
            }
            summary("Member", job.contactName.isEmpty ? "—" : job.contactName)
            summary("Vehicle", "\(job.vehicle.year) \(job.vehicle.make) \(job.vehicle.model)")
            summary("Stop", "\(location.road) mile \(location.mile), \(TowyMath.sideLabel(job.situation.side).lowercased())")
            summary("Equipment", "\(TowyMath.equipmentLabel(job.situation.equipment))\(job.situation.winch ? " · winch" : "")\(job.situation.police ? " · officer" : "")")
        }
    }

    private func yesNo(_ title: String, _ value: Bool, _ set: @escaping (Bool) -> Void) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.subheadline.weight(.medium)).foregroundStyle(TowyColor.muted)
            ChoiceRow(title: "Yes", selected: value) { set(true) }
            ChoiceRow(title: "No", selected: !value) { set(false) }
        }
    }

    private func field(_ title: String, _ value: String, _ keyboard: UIKeyboardType = .default, _ set: @escaping (String) -> Void) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            FieldLabel(title: title)
            UnderlineField(text: Binding(get: { value }, set: set), keyboard: keyboard)
        }
    }

    private func summary(_ k: String, _ v: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(k).foregroundStyle(TowyColor.muted)
            Spacer()
            Text(v).multilineTextAlignment(.trailing)
        }
        .font(.subheadline)
        .padding(.vertical, 6)
    }
}

private struct FlowChoices<Content: View>: View {
    var items: [String]
    @ViewBuilder var content: (String) -> Content
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(items, id: \.self, content: content)
        }
    }
}
