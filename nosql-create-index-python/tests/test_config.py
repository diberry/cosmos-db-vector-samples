"""Unit tests for config loading and validation."""

import os
import unittest
from unittest.mock import patch

from src.config import (
    KNOWN_CONTAINERS,
    ConfigError,
    _container_name,
    load_config,
    sample_root,
    target_containers,
    validate_config,
)


class ConfigTests(unittest.TestCase):
    def setUp(self) -> None:
        self.valid_env = {
            "AZURE_COSMOSDB_ENDPOINT": "https://example.documents.azure.com:443/",
            "AZURE_COSMOSDB_CREATE_INDEX_DATABASENAME": "Hotels",
            "AZURE_COSMOSDB_CONTAINER_NAME": "",
            "AZURE_OPENAI_EMBEDDING_ENDPOINT": "https://example.openai.azure.com/",
            "AZURE_OPENAI_EMBEDDING_DEPLOYMENT": "text-embedding-3-small",
            "AZURE_OPENAI_EMBEDDING_API_VERSION": "2024-08-01-preview",
            "AZURE_SUBSCRIPTION_ID": "00000000-0000-0000-0000-000000000000",
            "AZURE_RESOURCE_GROUP": "example-rg",
            "AZURE_COSMOSDB_ACCOUNT_NAME": "example-account",
            "VECTOR_ALGORITHM": "",
            "DATA_FILE_WITH_VECTORS_AND_REGIONS": "..\\data\\HotelsData_toCosmosDB_Vector_byRegion.json",
        }

    def test_load_config_defaults_to_both_containers(self) -> None:
        config = load_config(self.valid_env)
        self.assertEqual(
            tuple(target_containers(config)),
            tuple(KNOWN_CONTAINERS.values()),
        )

    def test_empty_container_environment_values_use_defaults(self) -> None:
        with patch.dict(
            os.environ,
            {
                "AZURE_COSMOSDB_CREATE_INDEX_DISKANN_CONTAINER_NAME": "",
                "AZURE_COSMOSDB_CREATE_INDEX_QUANTIZEDFLAT_CONTAINER_NAME": "",
            },
        ):
            self.assertEqual(
                _container_name(
                    "AZURE_COSMOSDB_CREATE_INDEX_DISKANN_CONTAINER_NAME",
                    "hotels_diskann",
                ),
                "hotels_diskann",
            )
            self.assertEqual(
                _container_name(
                    "AZURE_COSMOSDB_CREATE_INDEX_QUANTIZEDFLAT_CONTAINER_NAME",
                    "hotels_quantizedflat",
                ),
                "hotels_quantizedflat",
            )

    def test_load_config_resolves_shared_data_file(self) -> None:
        config = load_config(self.valid_env)
        expected_path = (
            sample_root() / "..\\data\\HotelsData_toCosmosDB_Vector_byRegion.json"
        ).resolve()
        self.assertEqual(config.data_file_with_vectors, expected_path)

    def test_load_config_supports_legacy_data_file_variable(self) -> None:
        env = dict(self.valid_env)
        env.pop("DATA_FILE_WITH_VECTORS_AND_REGIONS")
        env["DATA_FILE_WITH_VECTORS"] = "..\\data\\HotelsData_toCosmosDB_Vector.json"
        config = load_config(env)
        expected_path = (sample_root() / "..\\data\\HotelsData_toCosmosDB_Vector.json").resolve()
        self.assertEqual(config.data_file_with_vectors, expected_path)

    def test_validate_config_rejects_missing_required_values(self) -> None:
        invalid_env = dict(self.valid_env)
        invalid_env["AZURE_OPENAI_EMBEDDING_ENDPOINT"] = ""
        config = load_config(invalid_env)

        with self.assertRaises(ConfigError):
            validate_config(config)

    def test_validate_config_rejects_missing_control_plane_value(self) -> None:
        invalid_env = dict(self.valid_env)
        invalid_env["AZURE_SUBSCRIPTION_ID"] = ""
        config = load_config(invalid_env)

        with self.assertRaisesRegex(ConfigError, "AZURE_SUBSCRIPTION_ID"):
            validate_config(config)

    def test_validate_config_rejects_inconsistent_container_and_algorithm(self) -> None:
        invalid_env = dict(self.valid_env)
        invalid_env["AZURE_COSMOSDB_CONTAINER_NAME"] = "hotels_quantizedflat_py"
        invalid_env["VECTOR_ALGORITHM"] = "diskann"
        config = load_config(invalid_env)

        with self.assertRaises(ConfigError):
            validate_config(config)

    def test_validate_config_accepts_single_algorithm(self) -> None:
        env = dict(self.valid_env)
        env["VECTOR_ALGORITHM"] = "diskann"
        config = load_config(env)
        validate_config(config)
        self.assertEqual(
            tuple(target_containers(config)),
            (KNOWN_CONTAINERS["diskann"],),
        )


if __name__ == "__main__":
    unittest.main()
