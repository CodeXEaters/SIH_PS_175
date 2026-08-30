"""CRS helpers backed by rasterio/PROJ."""

from rasterio.crs import CRS


def parse_crs(value: CRS | str | int) -> CRS:
	"""Parse an EPSG code, CRS string, or existing CRS object."""
	try:
		crs = CRS.from_user_input(value)
	except (TypeError, ValueError) as error:
		raise ValueError(f"invalid CRS: {value!r}") from error
	if crs is None:
		raise ValueError("CRS is required")
	return crs


def require_projected_crs(value: CRS | str | int) -> CRS:
	"""Parse a CRS and reject geographic degree-based coordinate systems."""
	crs = parse_crs(value)
	if crs.is_geographic:
		raise ValueError("a projected CRS is required for metric terrain coordinates")
	return crs
