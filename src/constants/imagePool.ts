const imagePool: Record<string, string[]> = {
    'hot-drinks': [
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'cold-drinks': [
        'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1607952958498-0eedb7bdcab0?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'fresh-juice': [
        'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'smoothies': [
        'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'mocktails': [
        'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1587223962930-cb7f31384c19?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1560508180-03f285f67ded?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'milkshakes': [
        'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'desserts': [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'waffles': [
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1598214886806-c1b2b18a1db2?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'crepes': [
        'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1534432182912-63863115e106?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1610614819513-58e34989848b?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'sandwiches': [
        'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'pasta': [
        'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'breakfast': [
        'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1520218421655-01f39551af7a?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'shisha': [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1567529684892-09290a1b2d05?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=480&h=360&fit=crop&auto=format&q=85',
    ],
    'extras': [
        'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=480&h=360&fit=crop&auto=format&q=85',
        'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=480&h=360&fit=crop&auto=format&q=85',
    ],
};

export function getItemImage(categoryId: string, index: number): string {
    const pool = imagePool[categoryId] ?? imagePool['hot-drinks'];
    return pool[index % pool.length];
}

export default imagePool;
