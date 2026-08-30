import numpy as np
import pytest
from rasterio.crs import CRS

from src.geospatial.crs import parse_crs, require_projected_crs
from src.mesh.texture_mapper import prepare_texture, uv_from_pixel


def test_crs_helpers_parse_and_require_projected_systems() -> None:
    assert parse_crs("EPSG:4326") == CRS.from_epsg(4326)
    assert require_projected_crs("EPSG:32644").to_epsg() == 32644
    with pytest.raises(ValueError, match="projected"):
        require_projected_crs("EPSG:4326")


def test_texture_helpers_validate_rgb_and_map_uv() -> None:
    texture = np.zeros((3, 4, 3), dtype=np.uint8)

    prepared = prepare_texture(texture)

    assert prepared is not texture
    assert uv_from_pixel(2, 3, 3, 4) == (1.0, 0.0)
    with pytest.raises(ValueError, match="uint8"):
        prepare_texture(texture.astype(np.float32))