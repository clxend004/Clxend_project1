// =========================================================
// SHARED COUNTRY / DIAL CODE DATA
// Used by RegisterScreen (mobile field) and LoginScreen
// (mobile login tab) so both stay in sync.
// =========================================================

const countries = [
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    minLength: 10,
    maxLength: 10,
    localPattern: /^[6-9][0-9]{9}$/,
  },
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    minLength: 10,
    maxLength: 10,
    localPattern: /^[2-9][0-9]{9}$/,
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    minLength: 10,
    maxLength: 10,
    localPattern: /^[2-9][0-9]{9}$/,
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "SG",
    name: "Singapore",
    dialCode: "+65",
    minLength: 8,
    maxLength: 8,
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dialCode: "+966",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "QA",
    name: "Qatar",
    dialCode: "+974",
    minLength: 8,
    maxLength: 8,
  },
  {
    code: "DE",
    name: "Germany",
    dialCode: "+49",
    minLength: 10,
    maxLength: 11,
  },
  {
    code: "FR",
    name: "France",
    dialCode: "+33",
    minLength: 9,
    maxLength: 9,
  },
];

export default countries;