"""
ResolveX Base Repository Layer
Unified data access abstraction bridging Supabase PostgreSQL and deterministic demo fixtures
"""

import json
import os
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger
from apps.api.app.core.supabase_client import get_supabase_client

class BaseRepository:
    def __init__(self):
        self._fixtures: Optional[Dict[str, List[Dict[str, Any]]]] = None
        self._load_fixtures_cache()

    def _load_fixtures_cache(self):
        """Loads deterministic JSON fixtures into memory as fallback cache"""
        path = Path(settings.FIXTURES_FILE)
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    self._fixtures = json.load(f)
                logger.info(f"Loaded {len(self._fixtures.get('customers', []))} fixture customers into repository cache.")
            except Exception as e:
                logger.error(f"Error loading fixture cache: {str(e)}")
                self._fixtures = {}
        else:
            logger.warning(f"Fixture file {settings.FIXTURES_FILE} not found. Running with empty fallback.")
            self._fixtures = {}

    def _query_fixture_table(
        self,
        table_name: str,
        filters: Optional[Dict[str, Any]] = None,
        search_query: Optional[str] = None,
        search_fields: Optional[List[str]] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Queries in-memory deterministic fixture table with filtering and pagination"""
        records = list(self._fixtures.get(table_name, []))

        # Apply exact-match filters
        if filters:
            for k, v in filters.items():
                if v is not None and v != "":
                    records = [r for r in records if str(r.get(k, "")).lower() == str(v).lower()]

        # Apply substring search
        if search_query and search_fields:
            sq = search_query.lower()
            records = [
                r for r in records
                if any(sq in str(r.get(f, "")).lower() for f in search_fields)
            ]

        total = len(records)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated = records[start_idx:end_idx]

        return paginated, total

    async def list_records(
        self,
        table_name: str,
        filters: Optional[Dict[str, Any]] = None,
        search_query: Optional[str] = None,
        search_fields: Optional[List[str]] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Reads records from Supabase table or falls back gracefully to fixture data"""
        if not settings.DEMO_MODE:
            try:
                client = get_supabase_client()
                query = client.table(table_name).select("*", count="exact")
                if filters:
                    for k, v in filters.items():
                        if v is not None and v != "":
                            query = query.eq(k, v)
                
                offset = (page - 1) * limit
                res = query.range(offset, offset + limit - 1).execute()
                if res.data and len(res.data) > 0:
                    return res.data, (res.count or len(res.data))
            except Exception as e:
                logger.warning(f"Supabase remote query for '{table_name}' failed or uninitialized ({str(e)}). Falling back to deterministic fixtures.")

        # Deterministic Fixture query
        return self._query_fixture_table(
            table_name=table_name,
            filters=filters,
            search_query=search_query,
            search_fields=search_fields,
            page=page,
            limit=limit
        )

    async def get_record_by_id(self, table_name: str, record_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single record by primary key UUID"""
        if not settings.DEMO_MODE:
            try:
                client = get_supabase_client()
                res = client.table(table_name).select("*").eq("id", record_id).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase remote lookup for '{table_name}:{record_id}' failed ({str(e)}). Checking fixture cache.")

        # Fixture lookup
        records = self._fixtures.get(table_name, [])
        for r in records:
            if str(r.get("id")) == str(record_id):
                return dict(r)
        return None

    async def insert_record(self, table_name: str, record: Dict[str, Any]) -> Dict[str, Any]:
        """Inserts a new record into Supabase and updates in-memory cache"""
        saved = dict(record)
        # 1. Update in-memory fixture cache
        if table_name not in self._fixtures:
            self._fixtures[table_name] = []
        self._fixtures[table_name].append(saved)

        # 2. Persist to Supabase if not pure mock
        if not settings.DEMO_MODE:
            try:
                client = get_supabase_client()
                res = client.table(table_name).insert(record).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase remote insert into '{table_name}' failed ({str(e)}). Stored in cache.")

        return saved

    async def update_record(self, table_name: str, record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates an existing record by ID in Supabase and in-memory cache"""
        updated_item = None
        records = self._fixtures.get(table_name, [])
        for r in records:
            if str(r.get("id")) == str(record_id):
                r.update(updates)
                updated_item = dict(r)
                break

        if not settings.DEMO_MODE:
            try:
                client = get_supabase_client()
                res = client.table(table_name).update(updates).eq("id", record_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase remote update on '{table_name}:{record_id}' failed ({str(e)}).")

        return updated_item

repo = BaseRepository()
