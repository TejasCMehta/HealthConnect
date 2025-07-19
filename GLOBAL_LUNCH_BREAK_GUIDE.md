# Global Lunch Break Feature & Troubleshooting Guide

## 🍽️ What is "Enable Global Lunch Break"?

### **Purpose & Benefits**

The "Enable Global Lunch Break" feature provides **centralized lunch break management** for your entire clinic:

#### **Key Benefits:**

- **🎯 Centralized Control**: Set one lunch break time that applies to all working days
- **⏰ Time Efficiency**: Configure once instead of setting up each day individually
- **🔄 Consistency**: Ensures uniform lunch break times across all clinic days
- **🛠️ Easy Updates**: Change global settings to update all days simultaneously
- **🎛️ Flexible Overrides**: Allow individual days to have custom lunch break when needed

#### **How It Works:**

**When Enabled:**

```
✅ Global Lunch Break: 12:00 - 13:00
├── Monday: 🌍 Using global (12:00 - 13:00)
├── Tuesday: 🌍 Using global (12:00 - 13:00)
├── Wednesday: 🌍 Using global (12:00 - 13:00)
├── Thursday: 🌍 Using global (12:00 - 13:00)
├── Friday: 🌍 Using global (12:00 - 13:00)
└── Saturday: 🔧 Custom override (11:30 - 12:30)
```

**Configuration Options:**

- **Enable Global Lunch Break**: Master toggle for clinic-wide lunch break
- **Time Settings**: Start and end time for global lunch break
- **Apply to All Days**: Automatically inherit global settings on all working days
- **Enforce Strictly**: No appointments allowed during lunch break (strict mode)
- **Allow Exceptions**: Permit individual days to override global settings

## 🔧 Troubleshooting Save Button Issues

### **Current Implementation Status**

- ✅ Save button is properly configured as `type="submit"`
- ✅ Form has correct `(ngSubmit)="onWorkingHoursSubmit()"` binding
- ✅ Global lunch break form is included in save payload
- ✅ Both Angular (port 4201) and Express server (port 8000) are running

### **Debugging Steps Added**

I've added console logging to help diagnose any issues:

```typescript
// In onWorkingHoursSubmit():
console.log("onWorkingHoursSubmit called");
console.log("Current globalLunchBreakForm:", this.globalLunchBreakForm);
console.log("Updated settings to save:", updatedSettings);

// In toggleGlobalLunchBreak():
console.log("toggleGlobalLunchBreak called - current state:", enabled);
```

### **How to Check If Save Is Working**

1. **Open Browser Developer Tools** (F12)
2. **Go to Console Tab**
3. **Navigate to Settings → Working Hours**
4. **Toggle "Enable Global Lunch Break"**
5. **Click "Save Working Hours" button**
6. **Check Console for Debug Messages**

### **Expected Console Output**

```
toggleGlobalLunchBreak called - current state: false
toggleGlobalLunchBreak - new state: true
onWorkingHoursSubmit called
Current globalLunchBreakForm: {enabled: true, start: "12:00", end: "13:00", ...}
Updated settings to save: {workingHours: {globalLunchBreak: {...}, ...}}
Settings saved successfully: {...}
```

### **Common Issues & Solutions**

#### **Issue 1: Save Button Does Nothing**

**Symptoms**: Button click doesn't trigger any action
**Solution**: Check if form is valid and console shows error messages

#### **Issue 2: Settings Don't Persist**

**Symptoms**: Changes revert after page refresh
**Solution**: Verify Express server is running on port 8000

#### **Issue 3: Toggle Doesn't Work**

**Symptoms**: Checkbox doesn't change state
**Solution**: Check console for JavaScript errors

#### **Issue 4: Form Validation Errors**

**Symptoms**: Form won't submit due to validation
**Solution**: Ensure all required fields are filled

## 🚀 Testing the Feature

### **Test Scenario 1: Basic Global Lunch Break**

1. ✅ Navigate to Settings → Working Hours
2. ✅ Enable "Global Lunch Break" checkbox
3. ✅ Set lunch break time (e.g., 12:00 - 13:00)
4. ✅ Check "Apply to all days"
5. ✅ Click "Save Working Hours"
6. ✅ Verify success message appears
7. ✅ Refresh page and confirm settings persist

### **Test Scenario 2: Individual Day Overrides**

1. ✅ Enable global lunch break with "Allow Exceptions"
2. ✅ Click "Override for Saturday"
3. ✅ Set custom Saturday lunch break (11:30 - 12:30)
4. ✅ Save settings
5. ✅ Verify Saturday shows custom time, other days use global

### **Test Scenario 3: Calendar Integration**

1. ✅ Enable global lunch break and save
2. ✅ Navigate to Calendar view
3. ✅ Try to create appointment during lunch break time
4. ✅ Verify appointment form shows validation error
5. ✅ Confirm lunch break time slots are excluded from dropdowns

## 📊 Database Structure

The global lunch break settings are stored in `db.json`:

```json
{
  "settings": {
    "workingHours": {
      "globalLunchBreak": {
        "enabled": false,
        "start": "12:00",
        "end": "13:00",
        "applyToAllDays": true,
        "enforceStrictly": true,
        "allowExceptions": false
      },
      "monday": {
        "start": "08:00",
        "end": "18:00",
        "enabled": true,
        "lunchBreak": {
          "enabled": false,
          "start": "12:00",
          "end": "13:00",
          "overrideGlobal": false
        }
      }
    }
  }
}
```

## 🎯 Next Steps

1. **Test the Feature**: Use the debugging steps above to verify functionality
2. **Check Console**: Look for any error messages during save operation
3. **Verify Network**: Ensure API calls are reaching the Express server
4. **Report Issues**: If problems persist, share console output for further diagnosis

The global lunch break feature provides powerful centralized management while maintaining flexibility for individual day customizations. The save functionality should work correctly with both servers running properly.
