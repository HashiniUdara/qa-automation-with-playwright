// server/cases.js

module.exports = [
  {
    id: 'login-valid',
    title: 'Form Authentication - Valid Login',
    file: 'login.spec.js',
    grep: 'Form Authentication valid login',
    criticality: 'CRITICAL',
    group: 'Login / Validation'
  },
  {
    id: 'login-invalid',
    title: 'Form Authentication - Invalid Username',
    file: 'login.spec.js',
    grep: 'Form Authentication invalid username',
    criticality: 'HIGH',
    group: 'Login / Validation'
  },
  {
    id: 'checkboxes',
    title: 'Checkboxes - Select and Unselect',
    file: 'checkboxes.spec.js',
    grep: 'select and unselect a checkbox',
    criticality: 'MEDIUM',
    group: 'Form Elements'
  },
  {
    id: 'dropdown',
    title: 'Dropdown - Select Option 2',
    file: 'dropdown.spec.js',
    grep: 'select dropdown option 2',
    criticality: 'MEDIUM',
    group: 'Form Elements'
  },
  {
    id: 'dynamic-elements',
    title: 'Dynamic Elements - Add and Remove',
    file: 'dynamic-elements.spec.js',
    grep: 'add and remove dynamic element',
    criticality: 'HIGH',
    group: 'Dynamic UI'
  },
  {
    id: 'alerts',
    title: 'JavaScript Alerts - Accept Alert',
    file: 'alerts.spec.js',
    grep: 'accept JavaScript alert',
    criticality: 'MEDIUM',
    group: 'Dynamic UI'
  }
];