# State Migration Issues

## Overview
During the migration from file-based data to database, the following state value inconsistencies need to be addressed:

## Issues Found

### 1. Missing Dot in Federal Territory
- **Issue**: `"W.P Labuan"` (missing dot after "W.P")
- **Count**: 2 entries
- **Fix**: Change to `"W.P. Labuan"`

### 2. Extra Whitespace
- **Issue**: `" Kelantan "` (leading and trailing spaces)
- **Count**: 1 entry  
- **Fix**: Change to `"Kelantan"`

- **Issue**: `" Selangor"` (leading space)
- **Count**: 1 entry
- **Fix**: Change to `"Selangor"`

### 3. Incorrect State Name
- **Issue**: `"Serendah"` (Serendah is a town, not a state)
- **Count**: 1 entry
- **Context**: Entry shows `state: "Serendah", city: "Selangor"` 
- **Fix**: Change to `state: "Selangor", city: "Serendah"`

## Migration SQL Fixes

When migrating data, apply these fixes:

```sql
-- Fix missing dot in W.P Labuan
UPDATE institutions 
SET state = 'W.P. Labuan' 
WHERE state = 'W.P Labuan';

-- Fix extra whitespace in Kelantan
UPDATE institutions 
SET state = 'Kelantan' 
WHERE state = ' Kelantan ';

-- Fix leading space in Selangor
UPDATE institutions 
SET state = 'Selangor' 
WHERE state = ' Selangor';

-- Fix incorrect state name (Serendah -> Selangor)
UPDATE institutions 
SET state = 'Selangor', city = 'Serendah'
WHERE state = 'Serendah';
```

## Standardized State List

The following states are now defined in the schema (`db/institutions.ts`):

1. Johor
2. Kedah  
3. Kelantan
4. Melaka
5. Negeri Sembilan
6. Pahang
7. Perak
8. Perlis
9. Pulau Pinang
10. Sabah
11. Sarawak
12. Selangor
13. Terengganu
14. W.P. Kuala Lumpur
15. W.P. Labuan
16. W.P. Putrajaya

## Verification

After migration, verify state consistency:

```sql
-- Check for any states not in the defined list
SELECT DISTINCT state 
FROM institutions 
WHERE state NOT IN (
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 
    'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 
    'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 
    'W.P. Labuan', 'W.P. Putrajaya'
);
```

---

*Analysis Date: July 5, 2025*  
*Total Institutions: 866*  
*Issues Found: 5 entries*