begin;

alter table public.saved_restaurants
    add column user_rating smallint
        check (user_rating between 1 and 5),

    add column user_category text not null default ''
        check (
            user_category in (
                '', 'vegetarian', 'italian', 'seafood'
            )
        ),

    add column user_price_level text not null default ''
        check (
            user_price_level in (
                '', 'inexpensive', 'moderate', 'expensive'
            )
        );

commit;