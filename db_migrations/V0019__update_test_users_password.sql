UPDATE t_p91748136_chess_support_world.users 
SET password_hash = '13d249c22c47b322cf1d94b91c9938d94388819d540012375a6eae11c42b9739',
    updated_at = NOW()
WHERE email IN ('1@1.ru', '2@2.ru', '3@3.ru', '4@4.ru');