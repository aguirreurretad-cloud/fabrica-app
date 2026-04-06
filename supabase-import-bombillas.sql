-- =============================================
-- Importación lista de precios: Bombillas
-- Dólar oficial al 2026-04-02: $1.415 ARS
-- precio_costo  = precio x bulto  × 1415
-- precio_venta  = precio x unidad × 1415
-- cantidad_mayorista_max = 600 (umbral bombillas)
-- =============================================

do $$
declare
  cat_inox     uuid;
  cat_bollon   uuid;
  cat_oferta   uuid;
  cat_alpaca   uuid;
begin

  -- Categorías
  insert into categorias (nombre, descripcion) values
    ('Bombillas Acero Inox 304',       'Bombillas de acero inoxidable 304')
  returning id into cat_inox;

  insert into categorias (nombre, descripcion) values
    ('Bombillones Acero Inox 304',     'Bombillones de acero inoxidable 304')
  returning id into cat_bollon;

  insert into categorias (nombre, descripcion) values
    ('Bombillas Oferta',               'Bombillas en oferta')
  returning id into cat_oferta;

  insert into categorias (nombre, descripcion) values
    ('Bombillas y Bombillones Alpaca', 'Bombillas y bombillones de alpaca')
  returning id into cat_alpaca;

  -- ─── BOMBILLAS ACERO INOX 304 ───────────────────────────────────────
  insert into productos
    (nombre, descripcion, categoria_id, precio_venta, precio_costo, cantidad_mayorista_max, stock_minimo, activo)
  values
    ('PL-001 Pico de Loro 3 Líneas',                          'Bombilla pico de loro 3 líneas - Inox 304',                        cat_inox, 2123, 1698, 600, 10, true),
    ('PL-002 Pico de Loro 3 Líneas Mini',                     'Bombilla pico de loro 3 líneas mini - Inox 304',                   cat_inox, 2123, 1698, 600, 10, true),
    ('PL-003 Pico de Loro 3 Líneas Micro',                    'Bombilla pico de loro 3 líneas micro - Inox 304',                  cat_inox, 2123, 1698, 600, 10, true),
    ('PL-004 Pico de Loro 3 Líneas Pico de Bronce',           'Bombilla pico de loro 3 líneas con pico de bronce - Inox 304',     cat_inox, 2901, 2476, 600, 10, true),
    ('PL-005 Pico de Loro 3 Líneas Pico de Bronce Mini',      'Bombilla pico de loro 3 líneas pico bronce mini - Inox 304',       cat_inox, 2901, 2476, 600, 10, true),
    ('PL-006 Pico de Loro Torneada',                          'Bombilla pico de loro torneada - Inox 304',                        cat_inox, 2689, 2264, 600, 10, true),
    ('PL-007 Pico de Loro Espejada Doble Anillo Bronce Mini', 'Bombilla pico de loro espejada doble anillo bronce mini - Inox 304', cat_inox, 2547, 2123, 600, 10, true),
    ('PL-008 Pico de Loro Espejada Anillo Bronce Ananá Mini', 'Bombilla pico de loro espejada anillo bronce ananá mini - Inox 304', cat_inox, 2547, 2123, 600, 10, true),
    ('PL-009 Pico de Loro Cincelada',                         'Bombilla pico de loro cincelada - Inox 304',                       cat_inox, 2406, 1981, 600, 10, true),
    ('PL-010 Pico de Loro Cincelada Mini',                    'Bombilla pico de loro cincelada mini - Inox 304',                  cat_inox, 2406, 1981, 600, 10, true),
    ('PL-011 Pico de Loro Cincelada a Mano',                  'Bombilla pico de loro cincelada a mano - Inox 304',                cat_inox, 2264, 1840, 600, 10, true),
    ('PL-012 Pico de Loro Cincelada a Mano Mini',             'Bombilla pico de loro cincelada a mano mini - Inox 304',           cat_inox, 2264, 1840, 600, 10, true),
    ('PL-013 Pico de Loro Silicona',                          'Bombilla pico de loro silicona - Inox 304',                        cat_inox, 1698, 1274, 600, 10, true),
    ('PL-014 Pico de Loro Silicona Mini',                     'Bombilla pico de loro silicona mini - Inox 304',                   cat_inox, 1698, 1274, 600, 10, true),
    ('CV-001 Curva Inox',                                     'Bombilla curva inox - Inox 304',                                   cat_inox, 2123, 1698, 600, 10, true),
    ('CV-002 Curva Inox Mini',                                'Bombilla curva inox mini - Inox 304',                              cat_inox, 2123, 1698, 600, 10, true),
    ('CV-003 Curva Inox Micro',                               'Bombilla curva inox micro - Inox 304',                             cat_inox, 2123, 1698, 600, 10, true),
    ('CV-004 Curva Inox Pico de Bronce',                      'Bombilla curva inox pico de bronce - Inox 304',                    cat_inox, 2901, 2476, 600, 10, true),
    ('CV-005 Curva Inox Pico de Bronce Mini',                 'Bombilla curva inox pico de bronce mini - Inox 304',               cat_inox, 2901, 2476, 600, 10, true),
    ('SP-002 Simple con Filtro',                              'Bombilla simple con filtro - Inox 304',                            cat_inox, 1627, 1203, 600, 10, true),
    ('SP-003 Simple 3 Líneas con Filtro',                     'Bombilla simple 3 líneas con filtro - Inox 304',                   cat_inox, 1698, 1274, 600, 10, true),
    ('SP-004 Simple con Aplique',                             'Bombilla simple con aplique - Inox 304',                           cat_inox, 1769, 1344, 600, 10, true),
    ('CH-001 Chata con Filtro',                               'Bombilla chata con filtro - Inox 304',                             cat_inox, 1627, 1203, 600, 10, true),
    ('CH-002 Chata 3 Líneas con Filtro',                      'Bombilla chata 3 líneas con filtro - Inox 304',                    cat_inox, 1698, 1274, 600, 10, true),
    ('CH-003 Chata con Filtro y Aplique Grabado',             'Bombilla chata con filtro y aplique grabado - Inox 304',           cat_inox, 1769, 1344, 600, 10, true),
    ('CH-005 Chata Enteriza',                                 'Bombilla chata enteriza - Inox 304',                               cat_inox,  849,  849, 600, 10, true),
    ('CH-006 Chata Enteriza 3 Líneas',                        'Bombilla chata enteriza 3 líneas - Inox 304',                      cat_inox, 1344,  920, 600, 10, true),
    ('CH-007 Chata Enteriza con Grabado',                     'Bombilla chata enteriza con grabado - Inox 304',                   cat_inox, 1415,  991, 600, 10, true),
    ('CH-008 Chata Enteriza Doble Anillo de Bronce',          'Bombilla chata enteriza con doble anillo de bronce - Inox 304',   cat_inox, 1415,  991, 600, 10, true);

  -- ─── BOMBILLONES ACERO INOX 304 ─────────────────────────────────────
  insert into productos
    (nombre, descripcion, categoria_id, precio_venta, precio_costo, cantidad_mayorista_max, stock_minimo, activo)
  values
    ('BPL-001 Bombillón Pico de Loro',                    'Bombillón pico de loro - Inox 304',                          cat_bollon, 2406, 1981, 600, 10, true),
    ('BPL-002 Bombillón PL Pico Bronce',                  'Bombillón pico de loro pico de bronce - Inox 304',           cat_bollon, 3184, 2759, 600, 10, true),
    ('BPL-003 Bombillón PL Cincelado a Mano',             'Bombillón pico de loro cincelado a mano - Inox 304',         cat_bollon, 2547, 2123, 600, 10, true),
    ('BPL-004 Bombillón PL Cincelado a Mano P/BCE',       'Bombillón pico de loro cincelado a mano pico bronce - Inox', cat_bollon, 3325, 2901, 600, 10, true),
    ('BPL-005 Bombillón Pico de Loro Desarmable Liso',    'Bombillón pico de loro desarmable liso - Inox 304',          cat_bollon, 3255, 2830, 600, 10, true),
    ('BCV-001 Bombillón Curvo',                           'Bombillón curvo - Inox 304',                                 cat_bollon, 2406, 1981, 600, 10, true),
    ('BCV-002 Bombillón Curvo Mini',                      'Bombillón curvo mini - Inox 304',                            cat_bollon, 2406, 1981, 600, 10, true),
    ('BCV-003 Bombillón Curvo Pico Bronce',               'Bombillón curvo pico bronce - Inox 304',                     cat_bollon, 3184, 2759, 600, 10, true),
    ('BCV-004 Bombillón Curvo Cincelado a Mano',          'Bombillón curvo cincelado a mano - Inox 304',                cat_bollon, 2547, 2123, 600, 10, true),
    ('BCV-005 Bombillón Curvo Cincelado a Mano P/BCE',    'Bombillón curvo cincelado a mano pico bronce - Inox 304',   cat_bollon, 3325, 2901, 600, 10, true),
    ('BCV-006 Bombillón Curvo Cincelado',                 'Bombillón curvo cincelado - Inox 304',                       cat_bollon, 2689, 2264, 600, 10, true),
    ('BCV-007 Bombillón Curvo Torneado',                  'Bombillón curvo torneado - Inox 304',                        cat_bollon, 2972, 2547, 600, 10, true),
    ('BCV-008 Bombillón Curvo Desarmable Torneado',       'Bombillón curvo desarmable torneado - Inox 304',             cat_bollon, 3821, 3396, 600, 10, true),
    ('BCV-009 Bombillón Recto Uruguayo',                  'Bombillón recto uruguayo - Inox 304',                        cat_bollon, 2406, 1981, 600, 10, true);

  -- ─── BOMBILLAS OFERTA ───────────────────────────────────────────────
  insert into productos
    (nombre, descripcion, categoria_id, precio_venta, precio_costo, cantidad_mayorista_max, stock_minimo, activo)
  values
    ('B-001 Resorte',                         'Bombilla resorte - Oferta',                        cat_oferta,  906,  481, 600, 10, true),
    ('B-002 Sorbete Acero Inoxidable 210mm',  'Sorbete de acero inoxidable 210mm - Oferta',       cat_oferta,  849,  425, 600, 10, true),
    ('B-003 Pico de Loro 3 Líneas Mini',      'Bombilla pico de loro 3 líneas mini - Oferta',     cat_oferta, 1981, 1557, 600, 10, true),
    ('B-004 Pico de Loro 3 Líneas',           'Bombilla pico de loro 3 líneas - Oferta',          cat_oferta, 1981, 1557, 600, 10, true);

  -- ─── BOMBILLAS Y BOMBILLONES ALPACA ─────────────────────────────────
  insert into productos
    (nombre, descripcion, categoria_id, precio_venta, precio_costo, cantidad_mayorista_max, stock_minimo, activo)
  values
    ('AP-001 Pico de Loro 3 Líneas',                          'Bombilla pico de loro 3 líneas - Alpaca',                        cat_alpaca, 3679, 3255, 600, 10, true),
    ('AP-002 Pico de Loro 3 Líneas Mini',                     'Bombilla pico de loro 3 líneas mini - Alpaca',                   cat_alpaca, 3679, 3255, 600, 10, true),
    ('AP-003 Pico de Loro Cincelada',                         'Bombilla pico de loro cincelada - Alpaca',                       cat_alpaca, 4104, 3679, 600, 10, true),
    ('AP-004 Pico de Loro Cincelada Mini',                    'Bombilla pico de loro cincelada mini - Alpaca',                  cat_alpaca, 4104, 3679, 600, 10, true),
    ('AP-005 Curva Lisa',                                     'Bombilla curva lisa - Alpaca',                                   cat_alpaca, 3679, 3255, 600, 10, true),
    ('BAP-001 Bombillón Alpaca Curvo Liso',                   'Bombillón curvo liso - Alpaca',                                  cat_alpaca, 4245, 3821, 600, 10, true),
    ('BAP-002 Bombillón Alpaca Curvo Cincelado',              'Bombillón curvo cincelado - Alpaca',                             cat_alpaca, 4811, 4387, 600, 10, true),
    ('BAP-003 Bombillón Alpaca Curvo Torneado',               'Bombillón curvo torneado - Alpaca',                              cat_alpaca, 9056, 8632, 600, 10, true),
    ('BAP-004 Bombillón Artesanal con Pico y Aplique BCE',    'Bombillón artesanal con pico y aplique de bronce - Alpaca',      cat_alpaca, 10471, 10047, 600, 10, true);

end $$;
