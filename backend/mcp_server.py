from typing import Annotated, Literal
from urllib.parse import quote

import httpx
from fastmcp import FastMCP
from pydantic import BaseModel, Field

mcp = FastMCP("Demo Server")

PUBCHEM_BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

# Available PubChem compound properties
PubchemCompoundProperty = Literal[
    "MolecularFormula",
    "MolecularWeight",
    "InChI",
    "InChIKey",
    "IUPACName",
    "Title",
    "XLogP",
    "ExactMass",
    "MonoisotopicMass",
    "TPSA",
    "Complexity",
    "Charge",
    "HBondDonorCount",
    "HBondAcceptorCount",
    "RotatableBondCount",
    "HeavyAtomCount",
    "CovalentUnitCount",
]


class PubchemSearchResult(BaseModel):
    """Result of a PubChem compound search."""

    cids: list[int] = Field(
        description="A list of matching PubChem Compound IDs (CIDs). "
        "This is often a single result but can be multiple for ambiguous names."
    )


class CompoundProperties(BaseModel):
    """Properties of a single PubChem compound."""

    CID: int = Field(description="The PubChem Compound ID.")
    MolecularFormula: str | None = None
    MolecularWeight: float | None = None
    InChI: str | None = None
    InChIKey: str | None = None
    IUPACName: str | None = None
    Title: str | None = None
    XLogP: float | None = None
    ExactMass: float | None = None
    MonoisotopicMass: float | None = None
    TPSA: float | None = None
    Complexity: float | None = None
    Charge: int | None = None
    HBondDonorCount: int | None = None
    HBondAcceptorCount: int | None = None
    RotatableBondCount: int | None = None
    HeavyAtomCount: int | None = None
    CovalentUnitCount: int | None = None


class PubchemCompoundPropertiesResult(BaseModel):
    """Result of fetching compound properties from PubChem."""

    results: list[CompoundProperties] = Field(
        description="A list of property results, with one object for each successfully retrieved CID."
    )


@mcp.tool
async def pubchem_search_compound_by_identifier(
    identifier_type: Annotated[
        Literal["name", "smiles", "inchikey"],
        Field(description="The type of chemical identifier being provided."),
    ],
    identifier: Annotated[
        str,
        Field(
            min_length=1,
            description="The identifier string. Examples: 'aspirin' for name, "
            "'CC(=O)Oc1ccccc1C(=O)O' for SMILES, or a valid InChIKey.",
        ),
    ],
) -> PubchemSearchResult:
    """
    Searches for PubChem Compound IDs (CIDs) using a common chemical identifier
    like a name (e.g., 'aspirin'), SMILES string, or InChIKey.

    This is the first step for most compound-related workflows.
    """
    path = f"/compound/{identifier_type}/{quote(identifier, safe='')}/cids/JSON"
    url = f"{PUBCHEM_BASE_URL}{path}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)

        if response.status_code == 404:
            # No compound found - return empty list
            return PubchemSearchResult(cids=[])

        response.raise_for_status()
        data = response.json()

    # Check for PubChem API fault
    if "Fault" in data:
        fault = data["Fault"]
        raise ValueError(f"PubChem API Fault: {fault.get('Message', 'Unknown error')}")

    # Extract CIDs from response
    identifier_list = data.get("IdentifierList", {})
    cids = identifier_list.get("CID", [])

    if not isinstance(cids, list):
        return PubchemSearchResult(cids=[])

    return PubchemSearchResult(cids=cids)


@mcp.tool
async def pubchem_fetch_compound_properties(
    cids: Annotated[
        list[int],
        Field(
            min_length=1,
            description="An array of one or more PubChem Compound IDs (CIDs) to fetch properties for. Must be positive integers.",
        ),
    ],
    properties: Annotated[
        list[PubchemCompoundProperty],
        Field(
            min_length=1,
            description="A list of physicochemical properties to retrieve for each CID.",
        ),
    ],
) -> PubchemCompoundPropertiesResult:
    """
    Fetches a list of specified physicochemical properties (e.g., MolecularWeight, XLogP)
    for one or more PubChem Compound IDs (CIDs). Essential for retrieving detailed
    chemical data in bulk.
    """
    cids_string = ",".join(str(cid) for cid in cids)
    properties_string = ",".join(properties)

    path = f"/compound/cid/{cids_string}/property/{properties_string}/JSON"
    url = f"{PUBCHEM_BASE_URL}{path}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)

        if response.status_code == 404:
            # No compounds found - return empty results
            return PubchemCompoundPropertiesResult(results=[])

        response.raise_for_status()
        data = response.json()

    # Check for PubChem API fault
    if "Fault" in data:
        fault = data["Fault"]
        raise ValueError(f"PubChem API Fault: {fault.get('Message', 'Unknown error')}")

    # Extract properties from response
    property_table = data.get("PropertyTable", {})
    compound_properties = property_table.get("Properties", [])

    if not compound_properties:
        raise ValueError(
            "Received an unexpected response format from PubChem API. Ensure CIDs are valid."
        )

    results = [CompoundProperties(**props) for props in compound_properties]
    return PubchemCompoundPropertiesResult(results=results)


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=8000)
