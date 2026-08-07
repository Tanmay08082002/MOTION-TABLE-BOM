# MOTION TABLE BOM CONFIGURATOR

> A browser-based engineering and sales configuration tool for **Motion Height Adjustable Workstations**, combining configurable workstation options, rule-driven Bill of Materials generation, product/drawing/model lookup, project information, pricing calculations, shop-drawing downloads, and formatted Excel BOM export.

**Repository:** `Tanmay08082002/MOTION-TABLE-BOM`

---

## Table of Contents

* [Overview](#overview)
* [Purpose](#purpose)
* [Key Features](#key-features)
* [Application Workflow](#application-workflow)
* [Supported Configuration](#supported-configuration)
* [BOM Generation Engine](#bom-generation-engine)
* [Project Information](#project-information)
* [Pricing and Order Value](#pricing-and-order-value)
* [3D Model / Preview System](#3d-model--preview-system)
* [Shop Drawing System](#shop-drawing-system)
* [Excel BOM Export](#excel-bom-export)
* [Architecture](#architecture)
* [Repository Structure](#repository-structure)
* [Data Architecture](#data-architecture)
* [Configuration State](#configuration-state)
* [Configuration Code System](#configuration-code-system)
* [BOM Lookup Logic](#bom-lookup-logic)
* [Asset Resolution Logic](#asset-resolution-logic)
* [Running the Application](#running-the-application)
* [Local Development](#local-development)
* [Deployment](#deployment)
* [Adding or Updating Products](#adding-or-updating-products)
* [Adding Models](#adding-models)
* [Adding Shop Drawings](#adding-shop-drawings)
* [Updating BOM Rules](#updating-bom-rules)
* [Updating the Excel Template](#updating-the-excel-template)
* [Troubleshooting](#troubleshooting)
* [Known Constraints](#known-constraints)
* [Future Development](#future-development)
* [Engineering Design Principles](#engineering-design-principles)
* [License](#license)

---

# Overview

The **MOTION TABLE BOM CONFIGURATOR** is a web-based configuration and BOM generation application designed around a configurable Motion Height Adjustable Workstation product.

Instead of manually selecting components and preparing a Bill of Materials in Excel, the application allows the user to configure the workstation through a controlled interface.

The application then dynamically determines:

* workstation type
* configuration
* person count
* table length
* table depth
* privacy panel configuration
* access flap configuration
* panel type
* workstation cluster quantity
* applicable components
* component quantities
* product codes
* drawing numbers
* project information
* commercial values
* shop drawing
* model/preview asset
* final Excel BOM

The application is implemented as a client-side HTML/CSS/JavaScript application.

Its main page is `index.html`, while configuration and BOM logic are separated into JavaScript modules and JSON data files.

---

# Purpose

The primary objective is to convert a workstation configuration into a controlled, repeatable and exportable manufacturing BOM.

The intended workflow is:

```text
User Configuration
        ↓
Application State
        ↓
Configuration Rules
        ↓
BOM Formula Engine
        ↓
Product / Drawing Lookup
        ↓
BOM Table
        ↓
Pricing Calculation
        ↓
Excel BOM Export
```

The application also connects the configuration to engineering assets:

```text
Configuration
      ↓
Lookup Table
      ├── Preview PDF
      ├── Model HTML
      └── Shop Drawing DXF
```

This creates a single configuration interface for sales, engineering and BOM preparation.

---

# Key Features

## 1. Product Selection

The application currently provides a product hub containing:

* **Motion Height Adjustable**
* **HUB**

The Motion product is the primary configuration workflow.

---

## 2. Motion Workstation Configuration

The Motion configurator provides controls for:

* Workstation subtype
* Configuration
* Access flap location
* Person count
* Table length
* Table depth
* Privacy panel height
* Privacy panel
* Privacy panel type
* Number of repeating workstation cluster units

The configuration state is recalculated whenever an option changes.

---

## 3. Multiple Workstation Types

The Motion system supports different workstation subtypes:

### Linear

```text
LINEAR
```

Label:

```text
Linear Workstation
```

### L-Type

```text
LTYPE
```

Label:

```text
L-Type Workstation
```

### 120° Workstation

```text
120DEG
```

Label:

```text
120° Workstation
```

The available workstation configurations depend on the selected subtype.

---

# Supported Configuration

The current configuration engine supports:

## Workstation configurations

### Free Standing

```text
FREE STANDING WORKSTATION
```

### Back to Back

```text
BACK TO BACK WORKSTATION
```

For the 120° subtype, the standard workstation configuration is also supported:

```text
STANDARD WORKSTATION
```

---

# Access Flap

The access flap selector supports:

```text
LHS
RHS
CENTRE
NO
```

These represent:

| Internal Value | Meaning                     |
| -------------- | --------------------------- |
| `LHS`          | Left-hand-side access flap  |
| `RHS`          | Right-hand-side access flap |
| `CENTRE`       | Centre access flap          |
| `NO`           | No access flap              |

If the access flap is disabled, related components are automatically removed from the BOM.

---

# Privacy Panel

Privacy panel options include:

```text
YES
NO
```

If privacy panels are enabled, the system supports panel types such as:

```text
FAB
MAGNETIC FAB
```

When privacy panels are disabled, associated privacy panel components and brackets are marked as **Not Applicable** and removed from the exported BOM.

---

# Table Dimensions

The application uses configurable table dimensions.

Current examples include:

### Length

```text
1200 mm
1350 mm
1500 mm
1650 mm
1800 mm
```

### Depth

```text
600 mm
700 mm
750 mm
800 mm
```

The selected dimensions are used directly by BOM descriptions and quantity rules.

For example:

```text
MOTION PLUS ... 1200LX600D
```

or:

```text
MOTION PLUS ... 1800LX800D
```

---

# Workstation Clusters

The workstation quantity can be increased using the cluster control.

The UI provides:

```text
−  [ quantity ]  +
```

The minimum value is:

```text
1
```

Increasing the cluster quantity causes applicable BOM quantities to scale automatically.

---

# BOM Generation Engine

The BOM engine is implemented in:

```text
assets/js/bom.js
```

The primary function is:

```javascript
buildBOM()
```

This function converts the current application state into a structured BOM.

Each BOM item contains information such as:

```javascript
{
    desc,
    code,
    drawing,
    qty,
    qtyRaw,
    na,
    origIdx
}
```

---

# BOM Rule Structure

The current BOM engine evaluates a series of component rows corresponding to the engineering BOM logic.

The principal component groups include:

1. Actuator
2. Table top
3. Horizontal cross member
4. Top support bracket
5. Foot / bottom support cross member
6. Access flap
7. Switch mounting box cabin
8. Switch mounting box plate
9. Vertibre
10. Cable tray
11. Cable tray connector
12. Vertical duct
13. Privacy panel
14. Privacy panel bracket
15. RHS privacy bracket where applicable

The exact component and quantity depend on the selected workstation configuration.

---

# Example BOM Logic

For example, the actuator quantity differs between Free Standing and Back-to-Back configurations.

For Free Standing:

```text
Actuator Qty = Cluster Qty
```

For Back-to-Back:

```text
Actuator Qty =
(Person Count / 2) × Cluster Qty
```

Similarly, table tops, support members, brackets, privacy components and cable-management components use different formulas according to workstation type.

---

# Not Applicable Handling

The application does not simply delete every unavailable component internally.

Instead, BOM rows can be represented as:

```text
Not Applicable
```

with:

```text
qty = null
```

and:

```text
na = true
```

The helper function:

```javascript
mk()
```

normalizes these records.

For an N/A component:

```text
Product Code = --
Drawing Number = --
Quantity = --
```

When exporting the Excel BOM, N/A rows are filtered out.

This allows the UI to preserve the full rule structure while keeping the final exported BOM clean.

---

# Product and Drawing Lookup

Product codes and drawing numbers are not hard-coded independently for every UI selection.

The BOM engine generates a component description and then searches the MotionDrawing dataset.

The lookup operation is:

```javascript
lookupByDesc(desc)
```

The lookup searches:

```text
MOTIONDRAWING
```

for a matching description.

A successful lookup returns:

```text
Product Code
Drawing Number
```

If no match exists:

```text
--
```

is returned.

This makes the JSON lookup data the master mapping between BOM descriptions and engineering identifiers.

---

# Project Information

The BOM interface includes a project information section.

Fields include:

| Field                    | Purpose                     |
| ------------------------ | --------------------------- |
| Project Name             | Project identification      |
| Zero Date                | Project date                |
| Zoho Number              | Zoho reference              |
| BOM Release Date         | BOM release                 |
| Dealer Name              | Dealer/customer information |
| Revised BOM Release Date | Revision release            |
| PO Number                | Purchase order              |
| PO Date                  | Purchase order date         |

These values are stored in:

```javascript
window.projectInfo
```

and are written into the Excel template during export.

---

# Pricing and Order Value

The BOM screen includes a commercial summary section.

Supported calculations include:

* Total Basic Value
* Discount
* Final Basic Value
* GST
* Installation & Transportation
* Octroi
* Total Order Value

The user can enter:

```text
Discount %
GST %
Installation & Transportation %
```

The final order value is recalculated from these values.

The exported workbook also receives corresponding formulas.

---

# 3D Model / Preview System

The application contains a model-preview workflow driven by the lookup dataset.

Model assets are stored under:

```text
Models/
```

The current application expects model assets with:

```text
.html
```

extensions.

The model path is determined dynamically rather than being hard-coded to a single model.

---

# Preview Asset Resolution

The application constructs several possible asset names based on the configuration.

For example, a base asset might be:

```text
WS_3
```

The system can attempt variants such as:

```text
WS_3_LHS_NOPRIV
WS_3_LHS
WS_3_NOPRIV
WS_3
```

This allows a configuration-specific asset to take precedence over a generic fallback.

The same resolution strategy is used for:

* Preview images/PDFs
* Models
* Shop drawings

---

# Preview PDF

Preview assets are stored under:

```text
Images/
```

The current code expects:

```text
.pdf
```

files.

When an appropriate PDF exists, the application embeds it into the preview stage.

If no matching PDF exists, the application falls back to a procedural visual representation.

---

# Procedural Preview

The application includes a procedural preview fallback.

If the expected preview asset cannot be found, JavaScript generates a simplified workstation illustration.

This allows the configuration interface to remain usable even when an engineering preview asset is unavailable.

---

# Shop Drawing System

Shop drawings are stored under:

```text
Drawings/
```

The current system expects:

```text
.dxf
```

files.

When the user clicks:

```text
Shop Drawing
```

the application:

1. Determines the current workstation configuration.
2. Finds the corresponding lookup entry.
3. Generates candidate drawing filenames.
4. Selects the appropriate drawing.
5. Downloads the DXF file.

The downloaded filename is generated according to the current configuration.

---

# Excel BOM Export

The application supports direct Excel BOM generation.

The export button is:

```text
Export BOM
```

The implementation uses:

```text
ExcelJS 4.3.0
```

loaded through CDN.

The application loads the actual Excel template:

```text
assets/templates/Bill_of_Material_Template.xlsx
```

rather than creating a completely new workbook from scratch.

This is important because the template contains the required:

* formatting
* borders
* merged cells
* title area
* column widths
* labels
* summary section
* sign-off structure
* existing visual identity

---

# Excel Export Strategy

The export process follows these major steps:

```text
1. Build BOM
2. Remove N/A items
3. Load Excel template
4. Load target worksheet
5. Populate project information
6. Clear template sample BOM rows
7. Add required BOM rows
8. Copy formatting
9. Write product codes
10. Write billing codes
11. Write descriptions
12. Write quantities
13. Write drawing numbers
14. Apply user edits
15. Rebuild summary section
16. Rebuild sign-off section
17. Add formulas
18. Freeze worksheet panes
19. Generate XLSX
20. Download file
```

---

# Excel Worksheet

The exporter expects the worksheet:

```text
SPACE WOOD ITEMWISE BOM
```

The current template structure is based around:

```text
Project Information
        ↓
BOM Header
        ↓
BOM Data
        ↓
Commercial Summary
        ↓
Sign-off
```

---

# Excel BOM Columns

The application currently works with the following BOM columns:

| Column | Field               |
| ------ | ------------------- |
| A      | S.N.                |
| B      | CLST CODE           |
| C      | PRODUCT FLAG        |
| D      | PRODUCT CODE        |
| E      | BILLING CODE        |
| F      | PRODUCT DESCRIPTION |
| G      | COLOR CODE          |
| H      | COLOR DESCRIPTION   |
| I      | THICKNES            |
| J      | WIDTH               |
| K      | HEIGHT              |
| L      | DEPTH               |
| M      | QTY                 |
| N      | COL2                |
| O      | COL3                |
| P      | COL4                |
| Q      | COL5                |
| R      | COL6                |
| S      | DWG NO.             |
| T      | DWG REV             |
| U      | PROJ DWG            |
| V      | PROJ DWG REV        |
| W      | LP                  |
| X      | AMOUNT              |
| Y      | VENDOR              |
| Z      | REMARK              |

---

# User Editable BOM Fields

The web BOM table maintains user edits separately from automatically calculated values.

Edits are stored using keys based on:

```text
rowIndex-columnIndex
```

Example:

```text
3-19
```

This prevents user modifications from being lost when the BOM is recalculated.

---

# Configuration State

Application state is maintained in:

```text
assets/js/state.js
```

The main state object contains:

```javascript
state = {
    activeProduct,
    motionSubType,
    wsType,
    accessFlap,
    person,
    length,
    depth,
    height,
    privacy,
    panelType,
    clusters,
    hubProduct,
    hubVariant
}
```

---

# Default Configuration

The application initializes with:

```text
Product:
Motion

Subtype:
Linear

Workstation:
Back to Back

Access Flap:
Centre

Persons:
2

Length:
1200 mm

Depth:
600 mm

Privacy:
Yes

Panel Type:
Magnetic Fabric

Clusters:
1
```

---

# Configuration Code System

The repository contains:

```text
assets/data/config_table.json
```

This dataset maps configuration combinations to configuration/product codes.

The documented key structure is:

```text
TYPE-PERSON-FLAP-PRIV[-PANEL]-L{length}-D{depth}-H{height}
```

Where:

### TYPE

```text
BTB
FST
```

### PERSON

```text
01
02
04
06
08
10
```

### FLAP

```text
FLAP
NOFLAP
```

### PRIV

```text
NOP
PNL-FAB
PNL-MFB
```

### Dimensions

```text
L{length}
D{depth}
H{height}
```

Example structure:

```text
BTB-02-FLAP-PNL-MFB-L1200-D600-H1050
```

The exact valid configuration keys are controlled by `config_table.json`.

---

# Data Architecture

The application loads four primary JSON datasets:

```text
motiondrawing.json
lookup.json
options.json
config_table.json
```

The loader is implemented in:

```text
assets/js/data.js
```

The data loader fetches all four files before the application begins rendering.

---

# motiondrawing.json

This is the product/component master used for BOM lookup.

It provides the relationship between:

```text
Description
    ↓
Product Code
    ↓
Drawing Number
```

The BOM engine generates a description and searches this dataset.

---

# lookup.json

The lookup dataset maps workstation configurations to engineering assets.

It is used for:

* preview assets
* model assets
* shop drawings
* workstation-specific mappings

The preview/model/drawing system uses the lookup record as its starting point.

---

# options.json

This file contains valid configuration options used by the UI.

It allows configuration choices to remain data-driven instead of requiring every option to be hard-coded directly into the interface.

---

# config_table.json

This file contains configuration-code mappings.

It is intended to represent the relationship between a complete workstation configuration and its corresponding configuration/product identifier.

---

# Repository Structure

Current repository structure:

```text
MOTION-TABLE-BOM/
│
├── Drawings/
│   └── *.dxf
│
├── Images/
│   └── *.pdf
│
├── Models/
│   └── *.html
│
├── assets/
│   │
│   ├── css/
│   │   └── style.css
│   │
│   ├── data/
│   │   ├── motiondrawing.json
│   │   ├── lookup.json
│   │   ├── options.json
│   │   └── config_table.json
│   │
│   ├── js/
│   │   ├── data.js
│   │   ├── state.js
│   │   ├── bom.js
│   │   ├── config.js
│   │   ├── preview.js
│   │   ├── hub.js
│   │   ├── ui.js
│   │   └── events.js
│   │
│   └── templates/
│       └── Bill_of_Material_Template.xlsx
│
├── index.html
├── sos_logo.png
└── README.md
```

The repository currently contains the main application page plus dedicated asset, data, model and drawing directories.

---

# JavaScript Module Responsibilities

## `data.js`

Responsible for loading:

```text
motiondrawing.json
lookup.json
options.json
config_table.json
```

and exposing them to the application.

---

## `state.js`

Responsible for:

* global application state
* default configuration
* workstation helper functions
* subtype configuration
* product state
* user BOM edits
* project information

---

## `bom.js`

Responsible for:

* BOM generation
* component quantity formulas
* component descriptions
* product-code lookup
* drawing-number lookup
* N/A handling

This is the core engineering rule engine.

---

## `config.js`

Responsible for generating human-readable configuration labels.

Example:

```text
Back to Back 4 Person · Centre Access Flap · MAGNETIC FAB Privacy Panel
```

---

## `preview.js`

Responsible for:

* asset candidate generation
* preview PDF resolution
* model path resolution
* drawing path resolution
* procedural preview fallback

---

## `hub.js`

Responsible for the HUB product section and HUB configuration/preview interface.

---

## `ui.js`

Responsible for rendering the application interface and BOM table.

---

## `events.js`

Responsible for application interaction.

It handles:

* product selection
* cluster controls
* project information
* summary calculations
* HUB selection
* model opening
* Excel export
* shop drawing download

---

# Running the Application

## Important

The application should be served through an HTTP server.

Do **not** rely on opening:

```text
index.html
```

directly using:

```text
file://
```

The application uses `fetch()` to load JSON and template files. Browser security restrictions can prevent those requests from working correctly when the page is opened directly from the filesystem.

The application itself displays an error indicating that the folder should be served over HTTP when its data files cannot be loaded.

---

# Option 1 — VS Code Live Server

Install the **Live Server** extension in VS Code.

Then:

1. Clone the repository.
2. Open the repository in VS Code.
3. Open `index.html`.
4. Right-click `index.html`.
5. Select **Open with Live Server**.

The application will open at a local HTTP address.

---

# Option 2 — Python HTTP Server

If Python is installed:

```bash
cd MOTION-TABLE-BOM
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

---

# Option 3 — Node.js Static Server

A static HTTP server can also be used.

For example:

```bash
npx serve .
```

Then open the URL provided by the server.

---

# Local Development

No backend server is currently required for the core configurator.

The architecture is primarily:

```text
Browser
   ↓
HTML
   ↓
CSS
   ↓
JavaScript
   ↓
JSON
   ↓
Local engineering assets
```

The application currently loads ExcelJS from a CDN:

```text
cdnjs.cloudflare.com
```

Therefore, normal internet connectivity is required unless the ExcelJS dependency is downloaded and hosted locally.

---

# Deployment

Because the application is primarily static, it can be deployed on a static hosting service.

Suitable environments include:

* GitHub Pages
* Netlify
* Vercel static hosting
* Cloudflare Pages
* Any standard web server

The complete directory structure must be preserved.

In particular, these paths must remain valid:

```text
/assets/data/
/assets/templates/
/assets/js/
/assets/css/
/Images/
/Models/
/Drawings/
```

---

# Adding or Updating Products

The preferred architecture is to keep product/configuration data in JSON rather than embedding large datasets directly inside JavaScript.

For a new configuration:

1. Add valid option values.
2. Add configuration mapping.
3. Add required product/component records.
4. Add lookup mappings.
5. Add preview/model/drawing assets.
6. Verify BOM formulas.
7. Test the Excel export.

---

# Adding Models

Place the model file inside:

```text
Models/
```

The filename must correspond to the lookup information used by the application.

For example:

```text
WS_3.html
```

or configuration-specific variants such as:

```text
WS_3_LHS.html
WS_3_LHS_NOPRIV.html
WS_3_NOPRIV.html
```

The application attempts more specific variants before falling back to the base model.

---

# Adding Shop Drawings

Place DXF files inside:

```text
Drawings/
```

The same configuration naming convention used by the lookup system should be followed.

Example:

```text
WS_3_LHS.dxf
```

The drawing resolution system tries configuration-specific variants before falling back to the base drawing.

---

# Adding Preview Images/PDFs

Preview documents are placed inside:

```text
Images/
```

The current application expects PDF preview assets.

Example:

```text
WS_3_LHS.pdf
```

If the specific asset is unavailable, the system tries fallback variants.

---

# Updating BOM Rules

The BOM rules are centralized in:

```text
assets/js/bom.js
```

When modifying a rule:

1. Identify the affected BOM row.
2. Identify the applicable workstation type.
3. Identify dependencies such as:

   * person count
   * cluster quantity
   * table dimensions
   * access flap
   * privacy panel
4. Update the formula.
5. Update the generated description if required.
6. Verify product lookup.
7. Verify drawing lookup.
8. Verify N/A handling.
9. Test XLSX export.

---

# Example Rule Change

Suppose a component should have:

```text
Quantity = Person Count × Cluster Count
```

The implementation should follow the existing state-driven architecture:

```javascript
const qty = state.person * state.clusters;
```

For configuration-specific behavior, branch according to the workstation type:

```javascript
const qty = isFS()
    ? state.clusters
    : state.person * state.clusters;
```

All engineering formulas should remain centralized in the BOM engine rather than duplicated inside the UI.

---

# Updating the Excel Template

The master Excel template is:

```text
assets/templates/Bill_of_Material_Template.xlsx
```

The exporter intentionally loads this file and preserves its formatting.

When changing the template:

* keep the worksheet name expected by the exporter
* preserve the expected project-information positions
* preserve BOM column ordering
* verify merged cells
* verify summary rows
* verify sign-off rows
* test exports with fewer than 9 BOM rows
* test exports with more than 9 BOM rows

The exporter contains logic specifically to preserve styles and rebuild merged summary/sign-off sections after changing the number of BOM rows.

---

# Excel Formula Structure

The generated workbook calculates values using formulas.

The summary includes:

```text
TOTAL BASIC VALUE
        ↓
DISCOUNT
        ↓
FINAL BASIC
        ↓
GST
        ↓
INSTALLATION & TRANSPORTATION
        ↓
OCTROI
        ↓
TOTAL ORDER VALUE
```

The exporter dynamically updates the formula row references based on the number of BOM items.

This prevents the summary formulas from pointing to fixed row numbers when the BOM size changes.

---

# File Naming

Exported BOM files use a configuration-based filename.

The format is approximately:

```text
BOM_<Subtype>_<Configuration>_<Length>x<Depth>.xlsx
```

Example:

```text
BOM_Linear_Workstation_Back_to_Back_1200x600.xlsx
```

The exact filename is generated automatically by the application.

---

# User Experience

The application is designed around an engineering-style configuration interface.

The major UI sections are:

```text
┌─────────────────────────────────────────────┐
│ PRODUCT SELECTOR                            │
├───────────────────────┬─────────────────────┤
│ CONFIGURATION         │ PREVIEW             │
│                       │                     │
│ Workstation Type      │ Model / PDF        │
│ Configuration         │                     │
│ Access Flap           │ Configuration      │
│ Person Count          │ KPIs               │
│ Length                │                     │
│ Depth                 │                     │
│ Privacy               │                     │
│ Cluster               │                     │
│                       │                     │
│ View Model            │                     │
│ Export BOM            │                     │
│ Shop Drawing          │                     │
├───────────────────────┴─────────────────────┤
│ PROJECT INFORMATION                         │
├─────────────────────────────────────────────┤
│ BILL OF MATERIALS                           │
├─────────────────────────────────────────────┤
│ COMMERCIAL SUMMARY                          │
├─────────────────────────────────────────────┤
│ SIGN-OFF                                    │
└─────────────────────────────────────────────┘
```

The current page structure exposes the configuration, preview, project information, BOM table, commercial summary and sign-off workflow directly in `index.html`.

---

# Architecture

The project follows a modular client-side architecture:

```text
                         ┌──────────────────┐
                         │    index.html    │
                         └────────┬─────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
         state.js              data.js              ui.js
             │                    │                    │
             │             ┌──────┴──────┐             │
             │             │             │             │
             ▼             ▼             ▼             ▼
        Application     JSON Data      Lookup       Rendering
          State
             │
             ▼
          bom.js
             │
      ┌──────┼────────┐
      │      │        │
      ▼      ▼        ▼
   Product  Drawing  Quantity
   Lookup   Lookup    Rules
      │      │        │
      └──────┼────────┘
             ▼
        BOM Table
             │
       ┌─────┴─────┐
       ▼           ▼
    DXF Export   XLSX Export
```

---

# Design Principle

The most important architectural principle is:

> **Configuration should drive the BOM, not the UI.**

The UI stores the user's choices.

The BOM engine interprets those choices.

The lookup data provides engineering identifiers.

The asset system provides engineering documents.

The Excel template provides the final business format.

This separation makes the system easier to maintain.

---

# Engineering Data Flow

The complete engineering data flow is:

```text
User
 │
 ├── Workstation Type
 ├── Person Count
 ├── Dimensions
 ├── Access Flap
 ├── Privacy
 ├── Panel Type
 └── Cluster Count
       │
       ▼
   state.js
       │
       ▼
    bom.js
       │
       ├── Component Description
       │
       ├── Quantity Formula
       │
       ▼
motiondrawing.json
       │
       ├── Product Code
       └── Drawing Number
       │
       ▼
    BOM Table
       │
       ├── XLSX
       ├── DXF
       └── Model / Preview
```

---

# Troubleshooting

## Blank page or data-loading error

### Cause

The application is being opened with:

```text
file://
```

### Solution

Run a local HTTP server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

---

## Product code shows `--`

### Possible causes

The generated BOM description does not exactly match a record in:

```text
motiondrawing.json
```

The lookup is description-based.

Check:

```text
assets/data/motiondrawing.json
```

and verify that the BOM-generated description exists exactly.

---

## Drawing shows `--`

Check:

1. `motiondrawing.json`
2. drawing filename
3. lookup mapping
4. `Drawings/` directory
5. file extension

The BOM drawing number comes from the MotionDrawing lookup.

---

## Model does not open

Check:

```text
Models/
```

and verify that the expected model filename exists.

Also check the browser developer console for:

```text
404
```

errors.

---

## Shop drawing does not download

Verify that the corresponding `.dxf` file exists in:

```text
Drawings/
```

and that its name matches one of the generated candidate filenames.

---

## Excel export fails

Check:

```text
assets/templates/Bill_of_Material_Template.xlsx
```

The application expects the workbook to contain:

```text
SPACE WOOD ITEMWISE BOM
```

If the worksheet has been renamed, the export process will fail.

Also verify that ExcelJS is loading correctly.

---

## Excel formatting is incorrect

The exporter intentionally copies styles and reconstructs merged cells.

If the source template has been significantly redesigned, the export mapping may need to be updated in:

```text
assets/js/events.js
```

---

# Browser Developer Console

For troubleshooting, open:

```text
F12
```

and select:

```text
Console
```

Useful errors include:

```text
Failed to load app data
```

```text
Template file not found
```

```text
Sheet not found in template
```

```text
Model file not found
```

```text
Shop drawing not found
```

HTTP `404` errors are especially useful for identifying missing engineering assets.

---

# Known Constraints

## 1. Client-side application

The current application does not require a backend database.

Data is loaded from static JSON files.

---

## 2. Exact Description Matching

The BOM lookup currently depends on exact component-description matching.

Therefore, changing a component description in `bom.js` without updating `motiondrawing.json` can break product-code and drawing-number lookup.

---

## 3. Asset Naming

The preview, model and drawing systems depend heavily on predictable asset names.

Incorrect filenames can result in fallback behavior or missing assets.

---

## 4. Excel Template Dependency

The Excel exporter depends on the structure of:

```text
Bill_of_Material_Template.xlsx
```

Major structural changes to the workbook require corresponding changes to the exporter.

---

## 5. Static File Hosting

The application expects JSON, XLSX, PDF, HTML and DXF files to be available from predictable relative paths.

The directory structure should therefore not be arbitrarily changed without updating the JavaScript asset paths.

---

# Future Development

The project can be extended into a full furniture/workstation configuration platform.

Potential improvements include:

## Backend Product Database

Move:

```text
motiondrawing.json
lookup.json
options.json
config_table.json
```

into a central database.

Possible architecture:

```text
Frontend
   ↓
REST API
   ↓
Backend
   ↓
Product Database
```

---

## Admin Panel

An administrator could manage:

* products
* configurations
* component mappings
* product codes
* drawing numbers
* models
* DXFs
* prices
* BOM formulas
* configuration availability

without modifying source code.

---

## User Authentication

Possible roles:

```text
Admin
Sales
Engineering
Production
Dealer
Viewer
```

Each role could receive different permissions.

---

## Version Control for BOMs

A future version could maintain:

```text
BOM Revision
Configuration Revision
Drawing Revision
Product Revision
Price Revision
```

This would make the system more suitable for production environments.

---

## ERP / Zoho Integration

Because the application already contains a Zoho Number field, it can eventually be integrated with an ERP/CRM workflow.

Potential flow:

```text
Zoho CRM / ERP
       ↓
Project
       ↓
Configurator
       ↓
BOM
       ↓
Approval
       ↓
Production
```

---

## Parametric 3D Models

The current architecture can be extended so that model dimensions respond directly to:

```text
Length
Depth
Height
Person Count
Configuration
```

Instead of simply selecting a prebuilt model, a future implementation could generate a parametric assembly.

---

# Engineering Validation Recommendations

Before using the generated BOM for production, verify:

### Configuration

* [ ] Workstation type
* [ ] Person count
* [ ] Table length
* [ ] Table depth
* [ ] Privacy option
* [ ] Panel type
* [ ] Access flap
* [ ] Cluster quantity

### BOM

* [ ] Component descriptions
* [ ] Product codes
* [ ] Drawing numbers
* [ ] Quantities
* [ ] N/A components
* [ ] Cluster scaling

### Engineering Documents

* [ ] Preview
* [ ] Model
* [ ] Shop drawing
* [ ] Drawing revision

### Commercial

* [ ] Project information
* [ ] Discount
* [ ] GST
* [ ] Installation
* [ ] Transportation
* [ ] Final order value

### Export

* [ ] Excel template loaded
* [ ] Correct worksheet
* [ ] Correct formatting
* [ ] Correct BOM rows
* [ ] Correct formulas
* [ ] Correct sign-off
* [ ] File opens successfully in Excel

---

# Development Philosophy

This project is intended to keep engineering logic explicit and auditable.

Instead of hiding BOM logic inside a complex framework, the project uses relatively simple modules:

```text
Data
State
Rules
Lookup
Rendering
Export
```

This makes it easier for an engineering team to understand and validate the relationship between a workstation configuration and the resulting BOM.

---

# Contributing

When modifying the project:

1. Do not duplicate BOM formulas in multiple files.
2. Keep engineering rules in `bom.js`.
3. Keep configuration state in `state.js`.
4. Keep product/component master data in JSON.
5. Keep engineering assets in their dedicated directories.
6. Maintain the existing Excel template structure unless the exporter is updated.
7. Test all affected configurations after changing BOM logic.
8. Verify both browser output and exported XLSX output.
9. Do not commit confidential customer/project information.
10. Do not commit credentials, API keys or passwords.

---

# Recommended Change Workflow

For an engineering rule change:

```text
Requirement
    ↓
Identify affected configuration
    ↓
Identify BOM row
    ↓
Modify formula
    ↓
Update lookup data
    ↓
Update engineering asset
    ↓
Test configuration
    ↓
Verify BOM
    ↓
Verify Excel
    ↓
Commit
```

---

# Security

The application currently operates as a static client-side application.

Do not place sensitive information inside:

```text
JSON
HTML
JavaScript
GitHub repository
```

Do not store:

* passwords
* API tokens
* database credentials
* private customer information
* confidential pricing
* private engineering documents

inside the public repository.

If sensitive business data is introduced later, move it behind authenticated server-side APIs.

---

# Project Status

**Current architecture:** Client-side web application

**Primary product:** Motion Height Adjustable Workstation

**Primary output:** Engineering / commercial BOM

**BOM format:** Excel `.xlsx`

**Shop drawing format:** `.dxf`

**Preview format:** `.pdf`

**Model asset format currently expected by the application:** `.html`

**Configuration data:** JSON

**Excel library:** ExcelJS

**Backend:** None required for current architecture

**Database:** None required for current architecture

---

# Credits

Developed by:

**Aman & Tanmay**

The application header identifies the project as a BOM Configurator driven by MotionDrawing master and lookup tables.

---

# Repository

[MOTION-TABLE-BOM on GitHub](https://github.com/Tanmay08082002/MOTION-TABLE-BOM?utm_source=chatgpt.com)

---

# Summary

The MOTION TABLE BOM CONFIGURATOR provides a structured bridge between:

```text
PRODUCT CONFIGURATION
        ↓
ENGINEERING RULES
        ↓
COMPONENT BOM
        ↓
PRODUCT / DRAWING IDENTIFICATION
        ↓
ENGINEERING DOCUMENTS
        ↓
COMMERCIAL CALCULATION
        ↓
PRODUCTION-READY EXCEL BOM
```

Its modular architecture separates configuration state, BOM engineering rules, master data, lookup information, previews, drawings and Excel export.

This makes the project suitable as a foundation for a larger **parametric furniture configurator, engineering BOM generator and sales-to-production workflow**.

