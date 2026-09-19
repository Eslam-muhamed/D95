insert into public.tournament_participants (tournament_id, player_name, phone, status, payment_method)
values ('11111111-1111-1111-1111-111111111111', 'المستخدم 1', '01012345678', 'pending', 'cash')
returning *;
