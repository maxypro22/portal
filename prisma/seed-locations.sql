-- =============================================================================
-- Steak Town — seed the 2 real locations + full floor-plan tables (20 each).
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
--
-- Safe to re-run: each location is skipped (not duplicated) if one with the
-- same name already exists.
-- =============================================================================

do $$
declare
  v_loc_id text;
begin
  -- ---------------------------------------------------------------------------
  -- Location 1 — real branch: Sapphire Plaza Hotel, Al Reem Street, Doha
  -- ---------------------------------------------------------------------------
  select "id" into v_loc_id from "Location" where "name" = 'Steak Town — Sapphire Plaza';

  if v_loc_id is null then
    v_loc_id := gen_random_uuid()::text;

    insert into "Location" ("id", "name", "address", "phone", "isActive")
    values (
      v_loc_id,
      'Steak Town — Sapphire Plaza',
      'Sapphire Plaza Hotel, 8113, 950 Al Reem St, Doha, Qatar',
      '+974 30082849',
      true
    );

    insert into "Table" ("id", "locationId", "number", "capacity", "section", "shape", "posX", "posY")
    values
      (gen_random_uuid()::text, v_loc_id, 1, 4, 'MAIN', 'square', 12, 22),
      (gen_random_uuid()::text, v_loc_id, 2, 2, 'MAIN', 'round', 26, 22),
      (gen_random_uuid()::text, v_loc_id, 3, 4, 'MAIN', 'square', 40, 22),
      (gen_random_uuid()::text, v_loc_id, 4, 2, 'MAIN', 'round', 12, 42),
      (gen_random_uuid()::text, v_loc_id, 5, 4, 'MAIN', 'square', 26, 42),
      (gen_random_uuid()::text, v_loc_id, 6, 2, 'MAIN', 'round', 40, 42),
      (gen_random_uuid()::text, v_loc_id, 7, 4, 'MAIN', 'square', 12, 62),
      (gen_random_uuid()::text, v_loc_id, 8, 2, 'MAIN', 'round', 26, 62),
      (gen_random_uuid()::text, v_loc_id, 9, 4, 'MAIN', 'square', 40, 62),
      (gen_random_uuid()::text, v_loc_id, 10, 6, 'MAIN', 'rect', 26, 82),
      (gen_random_uuid()::text, v_loc_id, 11, 6, 'MAIN', 'rect', 12, 82),
      (gen_random_uuid()::text, v_loc_id, 12, 4, 'TERRACE', 'square', 62, 20),
      (gen_random_uuid()::text, v_loc_id, 13, 2, 'TERRACE', 'round', 62, 36),
      (gen_random_uuid()::text, v_loc_id, 14, 4, 'TERRACE', 'square', 62, 52),
      (gen_random_uuid()::text, v_loc_id, 15, 2, 'TERRACE', 'round', 62, 68),
      (gen_random_uuid()::text, v_loc_id, 16, 4, 'TERRACE', 'square', 62, 84),
      (gen_random_uuid()::text, v_loc_id, 17, 6, 'VIP', 'booth', 84, 26),
      (gen_random_uuid()::text, v_loc_id, 18, 6, 'VIP', 'booth', 84, 48),
      (gen_random_uuid()::text, v_loc_id, 19, 6, 'VIP', 'booth', 84, 70),
      (gen_random_uuid()::text, v_loc_id, 20, 8, 'VIP', 'booth', 84, 90);

    raise notice 'Created Sapphire Plaza with 20 tables';
  else
    raise notice 'Sapphire Plaza already exists — skipped';
  end if;

  -- ---------------------------------------------------------------------------
  -- Location 2 — Lusail branch (address/phone can be edited later in /admin)
  -- ---------------------------------------------------------------------------
  select "id" into v_loc_id from "Location" where "name" = 'Steak Town — Lusail';

  if v_loc_id is null then
    v_loc_id := gen_random_uuid()::text;

    insert into "Location" ("id", "name", "address", "phone", "isActive")
    values (
      v_loc_id,
      'Steak Town — Lusail',
      'Lusail City, Doha, Qatar',
      '+974 40337003',
      true
    );

    insert into "Table" ("id", "locationId", "number", "capacity", "section", "shape", "posX", "posY")
    values
      (gen_random_uuid()::text, v_loc_id, 1, 4, 'MAIN', 'square', 12, 22),
      (gen_random_uuid()::text, v_loc_id, 2, 2, 'MAIN', 'round', 26, 22),
      (gen_random_uuid()::text, v_loc_id, 3, 4, 'MAIN', 'square', 40, 22),
      (gen_random_uuid()::text, v_loc_id, 4, 2, 'MAIN', 'round', 12, 42),
      (gen_random_uuid()::text, v_loc_id, 5, 4, 'MAIN', 'square', 26, 42),
      (gen_random_uuid()::text, v_loc_id, 6, 2, 'MAIN', 'round', 40, 42),
      (gen_random_uuid()::text, v_loc_id, 7, 4, 'MAIN', 'square', 12, 62),
      (gen_random_uuid()::text, v_loc_id, 8, 2, 'MAIN', 'round', 26, 62),
      (gen_random_uuid()::text, v_loc_id, 9, 4, 'MAIN', 'square', 40, 62),
      (gen_random_uuid()::text, v_loc_id, 10, 6, 'MAIN', 'rect', 26, 82),
      (gen_random_uuid()::text, v_loc_id, 11, 6, 'MAIN', 'rect', 12, 82),
      (gen_random_uuid()::text, v_loc_id, 12, 4, 'TERRACE', 'square', 62, 20),
      (gen_random_uuid()::text, v_loc_id, 13, 2, 'TERRACE', 'round', 62, 36),
      (gen_random_uuid()::text, v_loc_id, 14, 4, 'TERRACE', 'square', 62, 52),
      (gen_random_uuid()::text, v_loc_id, 15, 2, 'TERRACE', 'round', 62, 68),
      (gen_random_uuid()::text, v_loc_id, 16, 4, 'TERRACE', 'square', 62, 84),
      (gen_random_uuid()::text, v_loc_id, 17, 6, 'VIP', 'booth', 84, 26),
      (gen_random_uuid()::text, v_loc_id, 18, 6, 'VIP', 'booth', 84, 48),
      (gen_random_uuid()::text, v_loc_id, 19, 6, 'VIP', 'booth', 84, 70),
      (gen_random_uuid()::text, v_loc_id, 20, 8, 'VIP', 'booth', 84, 90);

    raise notice 'Created Lusail with 20 tables';
  else
    raise notice 'Lusail already exists — skipped';
  end if;
end $$;

-- Verify — should show both locations with 20 tables each:
select l."name", count(t."id") as "tableCount"
from "Location" l
left join "Table" t on t."locationId" = l."id"
group by l."name";
