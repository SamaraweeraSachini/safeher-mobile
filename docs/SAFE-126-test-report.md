# SAFEHER MOBILE APPLICATION
# FINAL END-TO-END FUNCTIONAL TESTING REPORT

**Jira ID:** SAFE-126  
**Task:** Perform Final End-to-End Functional Testing  
**Project:** SafeHer Mobile Application  
**Platform:** Android  
**Testing Type:** Manual End-to-End Functional Testing  
**Branch:** `SAFE-126-Perform-final-end-to-end-functional-testing`

---

## 1. Introduction

### 1.1 Project Overview

SafeHer is a mobile application designed to improve personal safety by providing features such as incident reporting, safe route finding, trusted contact management, Safe Journey monitoring and emergency SOS functionality.

The application integrates mobile device capabilities with Firebase services to support authentication, data management and location-based functionality.

### 1.2 Purpose of Testing

The purpose of this task was to perform comprehensive end-to-end functional testing of the SafeHer application to verify that its main features operate correctly and provide the expected user experience.

The testing process focused on identifying functional issues, validating backend operations, checking permission-handling scenarios and evaluating application behaviour under different conditions.

### 1.3 Testing Objectives

- Verify onboarding and authentication workflows.
- Validate incident reporting operations.
- Test route searching and location-based functionality.
- Verify trusted contact management.
- Validate Safe Journey functionality.
- Test emergency SOS operations.
- Evaluate permission-denial scenarios.
- Verify Firestore data operations and persistence.
- Test loading, validation and error states.
- Evaluate application responsiveness on Android devices.
- Identify and resolve blocking defects.

---

## 2. Scope of Testing

The testing activity covered the following application modules:

| Module | Testing Coverage |
|---|---|
| Onboarding | Welcome screens and onboarding navigation |
| Authentication | Registration, login, guest access and logout |
| Incident Reporting | Submission, validation, retrieval and updating |
| Route Finding | Origin, destination, suggestions and route display |
| Trusted Contacts | Add, view, edit, delete and primary contact selection |
| Safe Journey | Journey creation, tracking and completion |
| SOS | Activation, lifecycle and emergency-related operations |
| Permissions | Location permission approval and denial |
| Firestore | Data creation, retrieval, updating and deletion |
| Error Handling | Validation, network and loading states |
| Responsiveness | Android screen layouts and interactions |

---

## 3. Testing Environment

### 3.1 Technology Stack

| Component | Technology |
|---|---|
| Mobile Framework | React Native |
| Development Framework | Expo |
| Programming Language | TypeScript |
| Backend | Firebase |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Package Manager | npm |
| Code Quality | ESLint |
| Type Checking | TypeScript Compiler |
| Development Server | Metro Bundler |
| Testing Platform | Android |

### 3.2 Environment Validation

The development environment was validated before beginning functional testing.

| Command | Purpose | Result |
|---|---|---|
| `npm install` | Install project dependencies | Completed with warnings |
| `npx tsc --noEmit` | Validate TypeScript | Passed |
| `npm run lint` | Check code quality | 0 errors, 7 warnings |
| `npx expo start -c` | Start Expo development server | Started successfully |

**Environment Observation:** Several dependencies reported a minimum Node.js requirement of `20.19.4`, while the installed version was `20.19.2`. Application installation and startup were nevertheless successful.

---

## 4. Testing Methodology

Manual functional testing was performed by interacting with the application and comparing actual behaviour against expected results.

The following testing approaches were used:

- **Positive Testing:** Verifying functionality using valid user inputs.
- **Negative Testing:** Testing invalid inputs and restricted operations.
- **Integration Testing:** Verifying communication between the application and Firebase services.
- **Permission Testing:** Checking application behaviour when device permissions are granted or denied.
- **Persistence Testing:** Verifying that saved information remains available after navigation or application reload.
- **Error Handling Testing:** Checking application responses to network interruptions and unsuccessful operations.

---

## 5. Detailed Functional Testing Results

### 5.1 Onboarding and Authentication

**Objective:** Verify that users can complete onboarding and access the application using registered or guest accounts.

| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| AUTH-01 | Open application | Welcome screen appears | PASS |
| AUTH-02 | Navigate onboarding screens | Navigation works correctly | PASS |
| AUTH-03 | Complete onboarding | Onboarding completes | PASS |
| AUTH-04 | Register a new account | Account is created | PASS |
| AUTH-05 | Login with valid credentials | User is authenticated | PASS |
| AUTH-06 | Continue as guest | Guest session starts | PASS |
| AUTH-07 | Logout | User session ends | PASS |
| AUTH-08 | Verify authentication navigation | Correct screens are accessible | PASS |

**Evaluation:** All eight recorded authentication and onboarding scenarios passed.

### 5.2 Incident Reporting

**Objective:** Verify incident submission, validation, retrieval, updating and persistence.

| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| IR-01 | Open reporting screen | Screen loads | PASS |
| IR-02 | Submit empty form | Validation appears | PASS |
| IR-03 | Submit valid report | Report is saved | PASS |
| IR-04 | Retrieve submitted report | Report details appear | PASS |
| IR-05 | Navigate away and return | Data persists | PASS |
| IR-06 | Edit or update report | Changes are saved | PASS |
| IR-07 | Disconnect internet | Appropriate error handling | PASS |

**Evaluation:** All seven incident reporting scenarios passed. The tests verified form validation, report submission, retrieval, updating and persistence.

### 5.3 Route Finding

**Objective:** Verify location detection, route searching, suggestions and permission handling.

| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| RF-01 | Open Safe Route screen | Screen loads | PASS |
| RF-02 | Select current location | Origin is populated | PASS |
| RF-03 | Deny location permission | Restriction is handled | PASS |
| RF-04 | Enter origin manually | Suggestions appear | PASS |
| RF-05 | Enter destination | Suggestions appear | PASS |
| RF-06 | Select both locations | Locations are populated | PASS |
| RF-07 | Search for route | Route results appear | PASS |
| RF-08 | View route on map | Route displays correctly | PASS |
| RF-09 | Enter invalid destination | Error is displayed | PASS |
| RF-10 | Disconnect internet | Error handling works | PASS |

**Evaluation:** All ten route-finding scenarios passed, including location permission denial, manual location entry and route searching.

### 5.4 Trusted Contacts

**Objective:** Verify contact management operations and guest-user restrictions.

| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| TC-01 | Open Trusted Contacts | Screen loads | PASS |
| TC-02 | Add contact | Contact is saved | PASS |
| TC-03 | View saved contacts | Details appear | PASS |
| TC-04 | Edit contact | Changes are saved | PASS |
| TC-05 | Delete contact | Contact is removed | PASS |
| TC-06 | Set primary contact | Primary status updates | PASS |
| TC-07 | Add duplicate contact | Duplicate is handled | PASS |
| TC-08 | Open as guest | Restriction message appears | PASS |
| TC-09 | Select Create Account | Registration opens | PASS |
| TC-10 | Reload application | Contacts persist | PASS |

**Evaluation:** All ten trusted contact scenarios passed. Contact management, persistence and guest restrictions operated as expected during the tested scenarios.

### 5.5 Safe Journey

**Objective:** Verify the journey creation, activation, monitoring and completion workflows.

| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| SJ-01 | Open Safe Journey | Screen loads | PASS |
| SJ-02 | Select origin | Origin is populated | PASS |
| SJ-03 | Select destination | Destination is populated | PASS |
| SJ-04 | Start journey | Journey starts | PASS |
| SJ-05 | View active journey | Journey details appear | PASS |
| SJ-06 | Track current location | Location updates | PASS |
| SJ-07 | Return to active journey | Active state is maintained | PASS |
| SJ-08 | Complete journey | Journey is completed | PASS |
| SJ-09 | Cancel journey, if supported | Journey is cancelled | PASS |
| SJ-10 | Deny location permission | Permission handling works | PASS |
| SJ-11 | Disconnect internet | Error handling works | PASS |
| SJ-12 | Verify persistence, if supported | Saved information is available | PASS |

**Evaluation:** The Safe Journey scenarios were reported as successfully tested, covering journey setup, activation, tracking and completion.

---

## 6. Permission and Error Handling

Permission and error-handling scenarios were included to evaluate how the application responds when required resources are unavailable.

| Area | Test Scenario | Result |
|---|---|---|
| Location | Grant location permission | PASS |
| Location | Deny location permission | PASS |
| Location | Attempt location-dependent operation without permission | PASS |
| Forms | Submit incomplete information | PASS |
| Network | Disconnect internet during reporting | PASS |
| Network | Disconnect internet during route searching | PASS |
| Guest Access | Attempt restricted contact operations | PASS |

The tested scenarios demonstrated appropriate handling of invalid inputs, restricted permissions and network interruptions.

---

## 7. Backend and Firestore Validation

The application was evaluated for its interaction with Firebase and Cloud Firestore.

The testing covered the following operations:

| Operation | Verification | Result |
|---|---|---|
| Create | Save incident reports and trusted contacts | PASS |
| Read | Retrieve previously saved information | PASS |
| Update | Modify existing contact and report information | PASS |
| Delete | Remove trusted contact information | PASS |
| Persistence | Retain saved data after navigation and reload | PASS |
| Authentication | Handle guest and registered-user states | PASS |

**Evaluation:** The tested application-level data operations completed successfully. Independent Firestore Security Rules verification should be documented separately before final security sign-off.

---

## 8. Code Quality and Application Startup

The project was evaluated using TypeScript, ESLint and Expo startup validation.

- TypeScript compilation completed without errors.
- ESLint reported zero errors and seven warnings.
- Dependencies were installed successfully.
- Metro Bundler started successfully.
- The application was accessible through Expo Go.

The remaining warnings and Node.js engine compatibility notices were recorded for further maintenance.

---

## 9. Defect Management

During testing, application behaviour was evaluated for defects affecting the main user workflows.

Any identified defects should be recorded with their severity, affected module, resolution and retest result.

| Defect ID | Description | Severity | Status |
|---|---|---|---|
| DEF-01 | Record any identified defect | To be assigned | To be updated |

No outstanding blocking defects should be declared only after all identified blocking issues have been retested and resolved.

---

## 10. Overall Testing Summary

| Module | Recorded Test Cases | Result |
|---|---:|---|
| Onboarding and Authentication | 8 | 8 Passed |
| Incident Reporting | 7 | 7 Passed |
| Route Finding | 10 | 10 Passed |
| Trusted Contacts | 10 | 10 Passed |
| Safe Journey | 12 | 12 Passed |
| **Total** | **47** | **47 Passed** |

*SOS testing, Android screen-size coverage and any additional security verification must be added to the execution summary after their individual results have been recorded.*

---

## 11. Recommendations

The following activities are recommended as part of final quality assurance:

1. Verify Firestore Security Rules independently.
2. Confirm that guest users cannot bypass frontend restrictions through direct backend operations.
3. Perform additional testing across different Android screen sizes.
4. Verify SOS activation, cancellation and notification delivery using controlled test accounts.
5. Validate location permission behaviour after permissions are revoked and restored.
6. Check application behaviour after force-closing and reopening.
7. Review the Node.js engine compatibility warnings.
8. Retest affected workflows after any blocking defect is fixed.

---

## 12. Conclusion

The SAFE-126 testing activity evaluated the main functional workflows of the SafeHer mobile application, including onboarding, authentication, incident reporting, route finding, trusted contact management and Safe Journey functionality.

A total of 47 test cases were recorded as passed across these modules.

The testing also covered permission-denial scenarios, data persistence, input validation and network error handling.

The results demonstrate that the tested application workflows operated according to their expected behaviour during the executed scenarios.

Further verification of SOS functionality, Android screen-size coverage and backend security controls should be documented before final testing sign-off.

---

## 13. Testing Evidence

The following screenshots and supporting materials should be attached to the SAFE-126 Jira issue:

| Evidence ID | Description |
|---|---|
| EVD-01 | Welcome and onboarding screens |
| EVD-02 | Registration, login and guest access |
| EVD-03 | Incident submission and report details |
| EVD-04 | Route searching and map display |
| EVD-05 | Location permission-denial handling |
| EVD-06 | Trusted contact management |
| EVD-07 | Guest restriction and registration navigation |
| EVD-08 | Safe Journey activation and completion |
| EVD-09 | SOS testing results |
| EVD-10 | TypeScript validation output |
| EVD-11 | ESLint validation output |
| EVD-12 | Expo application startup |
| EVD-13 | Android screen-size testing |

**Prepared for:** SAFE-126 – Perform Final End-to-End Functional Testing  
**Project:** SafeHer Mobile Application  
**Document:** Final End-to-End Functional Testing Report