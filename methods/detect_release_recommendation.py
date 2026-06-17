from typing import Optional


def detect_release_recommendation(status: str, purpose: str, email: bool, last_update: Optional[str]) -> str:
    if status in ["Dead / Not found", "Non-responsive"]:
        return "Release / Decommission"
    if status in ["Parked / Placeholder", "Placeholder / Coming soon"]:
        return "Monitor or hold"
    if status == "Broken / Server error":
        return "Investigate before release"
    if "Legacy" in purpose or status == "Inactive / Abandoned":
        return "Archive / Review manually"
    if email and status == "Active / Live":
        return "Keep active"
    return "Review with business owner"
