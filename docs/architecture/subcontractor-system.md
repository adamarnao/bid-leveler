# Subcontractor System

## Purpose

The subcontractor system is the central vendor management component of Bid Leveler.

It exists to:

* Maintain subcontractor company records.
* Track CSI trade coverage.
* Track service areas.
* Manage multiple locations and branches.
* Manage multiple contacts.
* Determine invite recipients during bid solicitation.
* Track vendor status and compliance information.
* Store vendor performance metrics (VPI).

---

## Data Hierarchy

### Company

A subcontractor company is the primary record.

Responsibilities stored at the company level:

* Company information
* Service area
* CSI coverage
* Vendor status
* Compliance
* Vendor Performance Index (VPI)

Example:

```text
AirCore Mechanical
```

---

### Locations

A company may have multiple locations.

Examples:

```text
Sarasota Office
Tampa Branch
Fort Myers Office
```

Locations may contain:

* Address
* Phone
* Email
* Notes
* Service area overrides

Most subcontractors will have zero or one location.

---

### Contacts

A company may have many contacts.

Examples:

```text
HVAC Estimator
Plumbing Estimator
Project Manager
Accounting
```

Contacts support:

* Primary contact
* Default invite recipient
* Active/inactive status
* Location assignment

---

## Invite Resolution

Current invite selection priority:

1. Active default invite recipients with email.
2. Active primary contact with email.
3. Active estimator contacts with email.
4. Any active contact with email.

---

## Future Contact Responsibilities

Planned:

* CSI division assignment
* CSI section assignment
* Service area assignment
* Branch assignment
* Role-specific routing

Example:

```text
John Smith
HVAC Estimator

Responsible:
- Division 23
- Sarasota
- Manatee
```

---

## Vendor Status

Current statuses:

* Preferred
* Approved
* Conditional
* Inactive
* Do Not Use

Preferred vendors receive prominent visibility but do not bypass compliance requirements.

---

## Compliance

Current compliance tracking:

* W-9
* Insurance
* License
* Bonding capacity

Future versions will support attached compliance documents.

---

## VPI

Vendor Performance Index tracks:

* Overall score
* Category scores
* Projects evaluated

Confidence is intentionally hidden from the user interface.
