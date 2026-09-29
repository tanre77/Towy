import Foundation

enum Drivetrain: String, Codable, CaseIterable { case FWD, RWD, AWD, fourWD = "4WD" }
enum Position: String, Codable, CaseIterable { case shoulder, lane, ditch, offroad }
enum Side: String, Codable, CaseIterable { case right, left, median, ramp }
enum Coverage: String, Codable, CaseIterable { case none, roadside, deductible, full }
enum Equipment: String, Codable { case wheelLift = "wheel-lift", flatbed }
enum Traffic: String, Codable { case light, moderate, heavy }
enum JobStatus: String, Codable { case draft, calling, quoted, enroute, checked, arrived, done }
enum Screen: String, Codable { case home, intake, calling, quotes, job, insurer, partner }

struct Vehicle: Codable, Equatable {
    var year: String
    var make: String
    var model: String
    var drivetrain: Drivetrain
    var tires: String
    var ev: Bool
    var color: String = ""
    var plate: String = ""

    enum CodingKeys: String, CodingKey { case year, make, model, drivetrain, tires, ev, color, plate }

    init(year: String, make: String, model: String, drivetrain: Drivetrain, tires: String, ev: Bool, color: String = "", plate: String = "") {
        self.year = year
        self.make = make
        self.model = model
        self.drivetrain = drivetrain
        self.tires = tires
        self.ev = ev
        self.color = color
        self.plate = plate
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        year = try c.decode(String.self, forKey: .year)
        make = try c.decode(String.self, forKey: .make)
        model = try c.decode(String.self, forKey: .model)
        drivetrain = try c.decode(Drivetrain.self, forKey: .drivetrain)
        tires = try c.decode(String.self, forKey: .tires)
        ev = try c.decode(Bool.self, forKey: .ev)
        color = try c.decodeIfPresent(String.self, forKey: .color) ?? ""
        plate = try c.decodeIfPresent(String.self, forKey: .plate) ?? ""
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(year, forKey: .year)
        try c.encode(make, forKey: .make)
        try c.encode(model, forKey: .model)
        try c.encode(drivetrain, forKey: .drivetrain)
        try c.encode(tires, forKey: .tires)
        try c.encode(ev, forKey: .ev)
        try c.encode(color, forKey: .color)
        try c.encode(plate, forKey: .plate)
    }
}

struct Situation: Codable, Equatable {
    var starts: Bool
    var rolls: Bool
    var position: Position
    var side: Side
    var equipment: Equipment
    var winch: Bool
    var police: Bool
    var equipmentTouched: Bool
    var winchTouched: Bool
    var policeTouched: Bool
}

struct Quote: Codable, Equatable, Identifiable {
    var id: String { companyId }
    var companyId: String
    var etaMin: Int
    var miles: Double
    var hook: Double
    var mileage: Double
    var equipmentFee: Double
    var winchFee: Double
    var afterHours: Double
    var policeWait: Double
    var total: Double
    var covered: Double
    var driverPays: Double
    var towyFee: Double
    var operatorReceives: Double
    var note: String
}

struct Review: Codable, Equatable, Identifiable {
    var id: String
    var companyId: String
    var author: String
    var stars: Int
    var text: String
}

struct CallResult: Codable, Equatable, Identifiable {
    var id: String { companyId }
    var companyId: String
    var available: Bool
    var decline: String?
    var quote: Quote?
}

struct LiveUpdate: Codable, Equatable {
    var etaMin: Int
    var total: Double
    var note: String
}

struct Payment: Codable, Equatable {
    var method: String
    var amount: Double
}

struct Job: Codable, Equatable, Identifiable {
    var id: String
    var contactName: String
    var contactPhone: String
    var vehicle: Vehicle
    var situation: Situation
    var locationId: String
    var coverage: Coverage
    var coverageLocked: Bool
    var calls: [CallResult]
    var selectedCompanyId: String?
    var status: JobStatus
    var live: LiveUpdate?
    var review: ReviewNote?
    var payment: Payment?
    var source: String
}

struct ReviewNote: Codable, Equatable {
    var stars: Int
    var text: String
}

struct Place: Identifiable {
    var id: String
    var road: String
    var direction: String
    var mile: String
    var place: String
    var traffic: Traffic
    var note: String
}

struct Company: Identifiable {
    var id: String
    var name: String
    var phone: String
    var yard: String
    var rating: Double
    var reviewCount: Int
    var evCertified: Bool
    var canWinch: Bool
    var canFlatbed: Bool
    var hook: Double
    var perMile: Double
    var flatbed: Double
    var winch: Double
    var bias: Double
    var flatbedEta: Double
    var miles: [String: Double]
}

enum TowyMath {
    static let rate = 0.06
    static let roadsideCap = 125.0
    static let deductible = 100.0
    static let afterHoursFee = 40.0
    static let afterHours = true

    static let places: [Place] = [
        Place(id: "i70-108", road: "I-70", direction: "Eastbound", mile: "108.2", place: "Bexley", traffic: .heavy, note: "Shoulder narrows at the Nelson Road exit."),
        Place(id: "i71-111", road: "I-71", direction: "Southbound", mile: "111.0", place: "Downtown", traffic: .moderate, note: "Innerbelt. Left lane is tight against the barrier."),
        Place(id: "sr315-4", road: "SR-315", direction: "Northbound", mile: "4.1", place: "Ohio State", traffic: .heavy, note: "Event traffic stacking toward Lane Avenue."),
        Place(id: "us33-12", road: "US-33", direction: "Westbound", mile: "12.6", place: "Dublin", traffic: .light, note: "Wide shoulder past the Frantz Road split."),
        Place(id: "i270-22", road: "I-270", direction: "Outer", mile: "22.4", place: "Easton", traffic: .moderate, note: "Outerbelt, east side. Ramp from Morse is slow."),
    ]

    static let companies: [Company] = [
        Company(id: "scioto", name: "Scioto Hook & Haul", phone: "(614) 555-0142", yard: "Franklinton", rating: 4.7, reviewCount: 312, evCertified: false, canWinch: true, canFlatbed: true, hook: 85, perMile: 6.5, flatbed: 60, winch: 145, bias: 1, flatbedEta: 4, miles: ["i70-108": 6.2, "i71-111": 2.4, "sr315-4": 4.6, "us33-12": 11.2, "i270-22": 10.4]),
        Company(id: "olentangy", name: "Olentangy Recovery", phone: "(614) 555-0177", yard: "Clintonville", rating: 4.5, reviewCount: 188, evCertified: false, canWinch: true, canFlatbed: true, hook: 95, perMile: 7, flatbed: 70, winch: 120, bias: 3, flatbedEta: 6, miles: ["i70-108": 9.1, "i71-111": 5.6, "sr315-4": 2.2, "us33-12": 6.4, "i270-22": 12.1]),
        Company(id: "outerbelt", name: "OuterBelt Tow", phone: "(614) 555-0108", yard: "Easton", rating: 4.8, reviewCount: 540, evCertified: false, canWinch: false, canFlatbed: true, hook: 75, perMile: 5.5, flatbed: 80, winch: 0, bias: -2, flatbedEta: 5, miles: ["i70-108": 8.4, "i71-111": 11.0, "sr315-4": 12.4, "us33-12": 14.2, "i270-22": 1.8]),
        Company(id: "northbank", name: "North Bank Flatbeds", phone: "(614) 555-0164", yard: "Italian Village", rating: 4.6, reviewCount: 96, evCertified: true, canWinch: true, canFlatbed: true, hook: 110, perMile: 6, flatbed: 45, winch: 155, bias: 2, flatbedEta: 2, miles: ["i70-108": 7.0, "i71-111": 3.3, "sr315-4": 3.8, "us33-12": 10.1, "i270-22": 11.0]),
        Company(id: "parsons", name: "Parsons Night Shift", phone: "(614) 555-0190", yard: "South Side", rating: 4.2, reviewCount: 74, evCertified: false, canWinch: true, canFlatbed: true, hook: 70, perMile: 7, flatbed: 90, winch: 165, bias: 6, flatbedEta: 8, miles: ["i70-108": 4.8, "i71-111": 4.1, "sr315-4": 8.2, "us33-12": 15.5, "i270-22": 9.2]),
    ]

    static let presets: [(String, Vehicle)] = [
        ("Civic", Vehicle(year: "2019", make: "Honda", model: "Civic", drivetrain: .FWD, tires: "215/55R16", ev: false)),
        ("Camry", Vehicle(year: "2018", make: "Toyota", model: "Camry", drivetrain: .FWD, tires: "215/55R17", ev: false)),
        ("F-150", Vehicle(year: "2021", make: "Ford", model: "F-150", drivetrain: .fourWD, tires: "275/65R18", ev: false)),
        ("Model Y", Vehicle(year: "2023", make: "Tesla", model: "Model Y", drivetrain: .AWD, tires: "255/45R19", ev: true)),
        ("Wrangler", Vehicle(year: "2016", make: "Jeep", model: "Wrangler", drivetrain: .fourWD, tires: "255/75R17", ev: false)),
    ]

    static func place(_ id: String) -> Place { places.first { $0.id == id } ?? places[0] }
    static func company(_ id: String) -> Company? { companies.first { $0.id == id } }

    static func round2(_ n: Double) -> Double { (n * 100).rounded() / 100 }

    static func usd(_ n: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "en_US")
        return formatter.string(from: NSNumber(value: n)) ?? String(format: "$%.2f", n)
    }

    static func trafficLabel(_ traffic: Traffic) -> String {
        switch traffic {
        case .heavy: "Heavy traffic"
        case .moderate: "Moderate traffic"
        case .light: "Light traffic"
        }
    }

    static func positionLabel(_ position: Position) -> String {
        switch position {
        case .shoulder: "On the shoulder"
        case .lane: "In a live lane"
        case .ditch: "In the ditch"
        case .offroad: "Off the roadway"
        }
    }

    static func sideLabel(_ side: Side) -> String {
        switch side {
        case .right: "Right side"
        case .left: "Left side"
        case .median: "Median"
        case .ramp: "On a ramp"
        }
    }

    static func equipmentLabel(_ equipment: Equipment) -> String {
        equipment == .flatbed ? "Flatbed" : "Wheel-lift truck"
    }

    static func recommendEquipment(_ vehicle: Vehicle, _ situation: Situation) -> Equipment {
        if vehicle.ev { return .flatbed }
        if !situation.rolls { return .flatbed }
        if (vehicle.drivetrain == .AWD || vehicle.drivetrain == .fourWD) && !situation.starts { return .flatbed }
        if situation.position == .offroad { return .flatbed }
        return .wheelLift
    }

    static func equipmentReason(_ vehicle: Vehicle, _ situation: Situation) -> String {
        if vehicle.ev { return "Electric. Wheels stay on a flatbed so the drivetrain is not dragged." }
        if !situation.rolls { return "It does not roll. A wheel-lift is the wrong truck." }
        if (vehicle.drivetrain == .AWD || vehicle.drivetrain == .fourWD) && !situation.starts {
            return "All-wheel drive that will not start can be damaged on a wheel-lift."
        }
        if situation.position == .offroad { return "Once it is winched up, it goes on a flatbed." }
        return "It rolls and it is not electric. A wheel-lift truck is enough."
    }

    static func recommendWinch(_ position: Position) -> Bool {
        position == .ditch || position == .offroad
    }

    static func winchReason(_ position: Position) -> String {
        recommendWinch(position) ? "Fish-out. The truck needs a winch." : "Still on pavement. No winch."
    }

    static func recommendPolice(_ position: Position, _ side: Side, _ traffic: Traffic) -> Bool {
        if position == .lane { return true }
        if (side == .median || side == .ramp) && traffic != .light { return true }
        return false
    }

    static func policeReason(_ position: Position, _ side: Side, _ traffic: Traffic) -> String {
        let load = traffic == .heavy ? "heavy" : traffic == .moderate ? "moving" : "light"
        if position == .lane { return "You are in a live lane and traffic is \(load). Ask for an officer before the truck arrives." }
        if side == .median && traffic != .light { return "You are in the median and traffic is \(load). A marked unit is worth the wait." }
        if side == .ramp && traffic == .heavy { return "The ramp is backed up. An officer keeps the merge from closing on the truck." }
        if traffic == .heavy { return "Traffic is heavy, but you are out of the lane. An officer is optional." }
        return "Traffic is \(load) and you are out of the lane. An officer is optional."
    }

    static func splitBill(_ total: Double, _ coverage: Coverage) -> (covered: Double, driverPays: Double, towyFee: Double, operatorReceives: Double) {
        let covered: Double
        switch coverage {
        case .full: covered = total
        case .roadside: covered = min(roadsideCap, total)
        case .deductible: covered = max(0, total - deductible)
        case .none: covered = 0
        }
        let driverPays = round2(max(0, total - covered))
        let towyFee = round2(driverPays * rate)
        return (round2(covered), driverPays, towyFee, round2(total - towyFee))
    }

    static func recompute(_ job: Job) -> Job {
        var next = job
        let location = place(job.locationId)
        if !next.situation.equipmentTouched { next.situation.equipment = recommendEquipment(next.vehicle, next.situation) }
        if !next.situation.winchTouched { next.situation.winch = recommendWinch(next.situation.position) }
        if !next.situation.policeTouched { next.situation.police = recommendPolice(next.situation.position, next.situation.side, location.traffic) }
        return next
    }

    static func quoteFor(_ company: Company, _ job: Job) -> Quote {
        let miles = company.miles[job.locationId] ?? 8
        let location = place(job.locationId)
        let flatbed = job.situation.equipment == .flatbed
        let hook = company.hook
        let mileage = round2(miles * company.perMile)
        let equipmentFee = flatbed ? company.flatbed : 0
        let winchFee = job.situation.winch ? company.winch : 0
        let after = afterHours ? afterHoursFee : 0
        let policeWait = job.situation.police ? 25.0 : 0
        let total = round2(hook + mileage + equipmentFee + winchFee + after + policeWait)
        let money = splitBill(total, job.coverage)
        let trafficAdd = location.traffic == .heavy ? 8.0 : location.traffic == .moderate ? 4.0 : 1.0
        let eta = max(12, min(75, Int((8 + miles * 1.65 + company.bias + trafficAdd + (flatbed ? company.flatbedEta : 0) + (afterHours ? 3 : 0)).rounded())))
        var note = "Price includes the Monday night rate."
        if job.vehicle.ev && !company.evCertified { note = "Not EV-certified. Confirm transport mode before loading." }
        if job.vehicle.ev && company.evCertified { note = "EV-certified flatbed." }
        if job.situation.police { note = "They will stage until the officer is on scene." }
        return Quote(companyId: company.id, etaMin: eta, miles: miles, hook: hook, mileage: mileage, equipmentFee: equipmentFee, winchFee: winchFee, afterHours: after, policeWait: policeWait, total: total, covered: money.covered, driverPays: money.driverPays, towyFee: money.towyFee, operatorReceives: money.operatorReceives, note: note)
    }

    static func buildCalls(_ job: Job) -> [CallResult] {
        let ready = recompute(job)
        let ranked = companies.sorted { ($0.miles[ready.locationId] ?? 99) < ($1.miles[ready.locationId] ?? 99) }
        var results: [CallResult] = []
        for company in ranked {
            if ready.situation.winch && !company.canWinch {
                results.append(CallResult(companyId: company.id, available: false, decline: "No winch on tonight's truck.", quote: nil))
            } else if ready.situation.equipment == .flatbed && !company.canFlatbed {
                results.append(CallResult(companyId: company.id, available: false, decline: "No flatbed free.", quote: nil))
            } else {
                results.append(CallResult(companyId: company.id, available: true, decline: nil, quote: quoteFor(company, ready)))
            }
            if results.filter({ $0.quote != nil }).count >= 3 { break }
        }
        return results
    }

    static func score(_ company: Company, _ reviews: [Review]) -> (rating: Double, count: Int) {
        let extra = reviews.filter { $0.companyId == company.id }
        let count = company.reviewCount + extra.count
        let sum = company.rating * Double(company.reviewCount) + Double(extra.reduce(0) { $0 + $1.stars })
        return (count == 0 ? company.rating : sum / Double(count), count)
    }

    static func callLines(_ company: Company, _ job: Job, _ result: CallResult) -> [String] {
        let location = place(job.locationId)
        let vehicle = "\(job.vehicle.year) \(job.vehicle.make) \(job.vehicle.model)"
        var lines = [
            "\(company.name). Dispatcher speaking.",
            "\(location.road) \(location.direction.lowercased()), mile \(location.mile), \(location.place). \(sideLabel(job.situation.side).lowercased()), \(positionLabel(job.situation.position).lowercased()).",
            "\(vehicle), \(job.vehicle.drivetrain.rawValue)\(job.vehicle.ev ? ", electric" : ""). Tires \(job.vehicle.tires.isEmpty ? "not listed" : job.vehicle.tires).",
            "\(job.situation.starts ? "It starts." : "It will not start.") \(job.situation.rolls ? "It rolls." : "It does not roll.") \(job.situation.police ? "Officer requested." : "No officer requested.")",
        ]
        guard result.available, let quote = result.quote else {
            lines.append(result.decline ?? "We can't take this one.")
            return lines
        }
        lines.append("\(equipmentLabel(job.situation.equipment))\(job.situation.winch ? " and a winch" : ""). We can be there in \(quote.etaMin) minutes.")
        lines.append("Estimate \(usd(quote.total)). \(quote.note)")
        return lines
    }

    static func halfway(_ job: Job) -> LiveUpdate {
        let location = place(job.locationId)
        let quote = job.calls.first { $0.companyId == job.selectedCompanyId }?.quote
        let current = job.live?.etaMin ?? quote?.etaMin ?? 20
        let total = quote?.total ?? job.live?.total ?? 0
        let slip = location.traffic == .heavy ? 3 : 0
        let eta = max(6, Int((Double(current) * 0.48).rounded()) + slip)
        let note: String
        if job.situation.police {
            note = "Officer is on the shoulder. Lane is moving. Price held."
        } else if slip > 0 {
            note = "Heavy traffic added a few minutes. Price held."
        } else {
            note = "Clear run from the shop. Price held."
        }
        return LiveUpdate(etaMin: eta, total: total, note: note)
    }

    static func blank(source: String = "member") -> Job {
        recompute(Job(
            id: "job-\(String(UUID().uuidString.prefix(6)).lowercased())",
            contactName: "",
            contactPhone: "",
            vehicle: presets[0].1,
            situation: Situation(starts: false, rolls: true, position: .shoulder, side: .right, equipment: .wheelLift, winch: false, police: false, equipmentTouched: false, winchTouched: false, policeTouched: false),
            locationId: "i70-108",
            coverage: .roadside,
            coverageLocked: false,
            calls: [],
            selectedCompanyId: nil,
            status: .draft,
            live: nil,
            review: nil,
            payment: nil,
            source: source
        ))
    }

    static func applySample(_ job: Job, ev: Bool) -> Job {
        var next = job
        next.contactName = job.contactName.isEmpty ? "Alex Chen" : job.contactName
        next.contactPhone = job.contactPhone.isEmpty ? "(614) 555-0198" : job.contactPhone
        if ev {
            next.vehicle = presets[3].1
            next.situation.starts = false
            next.situation.rolls = false
            next.situation.position = .ditch
            next.situation.side = .right
            next.situation.equipmentTouched = false
            next.situation.winchTouched = false
            next.situation.policeTouched = false
            next.locationId = "sr315-4"
            if !job.coverageLocked { next.coverage = .full }
        } else {
            next.vehicle = presets[0].1
            next.situation.starts = false
            next.situation.rolls = true
            next.situation.position = .shoulder
            next.situation.side = .right
            next.situation.equipmentTouched = false
            next.situation.winchTouched = false
            next.situation.policeTouched = false
            next.locationId = "i70-108"
            if !job.coverageLocked { next.coverage = .roadside }
        }
        return recompute(next)
    }

    static func phoneOk(_ phone: String) -> Bool {
        phone.filter(\.isNumber).count >= 10
    }

    static func vehicleOk(_ vehicle: Vehicle) -> Bool {
        !vehicle.year.trimmingCharacters(in: .whitespaces).isEmpty
            && !vehicle.make.trimmingCharacters(in: .whitespaces).isEmpty
            && !vehicle.model.trimmingCharacters(in: .whitespaces).isEmpty
    }

    static func coverageTitle(_ coverage: Coverage) -> String {
        switch coverage {
        case .none: "No coverage"
        case .roadside: "Roadside assist"
        case .deductible: "$100 deductible"
        case .full: "Tow fully covered"
        }
    }

    static func coverageDetail(_ coverage: Coverage) -> String {
        switch coverage {
        case .none: "Member pays the whole tow. Towy's 6% applies to all of it."
        case .roadside: "Policy pays the first $125. Towy's cut skips that part."
        case .deductible: "Member pays the first $100. Insurance pays the rest, untouched."
        case .full: "Insurance pays the shop in full. Towy's coordination fee is $0."
        }
    }
}
