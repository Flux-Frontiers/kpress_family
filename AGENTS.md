# Agent Instructions

Guidance for any AI coding agent working in this repository. Read
`PROVENANCE.md` too: it says what was copied from `knowledge_press` and what
changed in the copy.

## Before this edition becomes an App Store app

Read this before building an iPhone or Mac app for this edition, or before
submitting one. None of it applies to the web orchard on Pages.

The Forest (`knowledge_press`) is in review on the App Store as of 2026-10-29,
and its Mac App Store build is the only channel it ships through. Fielding
this edition as an app means fixing the following first:

- **Start from the Forest's current shells.** Copy `app/ios` and `app/macos`
  from `knowledge_press` at or after commit `4c47a6e`. That commit retired
  the notarized Developer ID Mac build (`mac-build`, `mac-notarize`,
  `mac-dmg`, `mac-release`). Do not bring it back: Apple's Developer ID
  profile cannot carry Private Cloud Compute, so that build was a weaker app
  than the store build. Ship only through the App Store, with
  `mac-archive`/`mac-upload` and `ios-archive`/`ios-upload`.
- **Its own identity.** It needs a new explicit bundle ID (never
  `com.fluxfrontiers.knowledgepress`, which belongs to the Forest's record),
  its own App Store Connect record, its own display name, and its own icon.
  The name and the press-seal icon are covered by `TRADEMARK.md`, not by a
  code license.
- **Its own store pages.** A privacy policy URL, a support URL, a privacy
  manifest (`PrivacyInfo.xcprivacy`) that matches what this edition
  collects, and listing text. The Forest's are for the Forest only.
- **Its own build numbers and versions.** A new record starts its build
  numbers fresh, so drop the Forest's `APP_BUILD_OFFSET`. Every version site
  has to agree.
- **This repo's leftovers from the Forest.** The kit's
  `app/KnowledgePressKit/Sources/KnowledgePressUI/Resources/AppIcon-1024.png`
  is still the Forest's press seal, byte for byte, and the module, target
  and app source still say Knowledge Press. Replace the icon and rename
  what the user sees before any build leaves this Mac.
