export interface User {
    id: number;
    name: string;
}

export interface Bill {
    id: number;
    description?: string;
    total_amount: number;
    tax: number;
    tip: number;
    tip_split_evenly: number;
    creator: {
        id: number;
        name: string;
    };
    created_at: string;
}

export interface BillCreate {
    description?: string;
    total_amount: number;
    tax: number;
    tip: number;
    tip_split_evenly: boolean;
    created_by: number;
}

export interface BillShareCreate {
    shares: Record<number, number>;
}

export interface BillShare {
    owner: {
        id: number;
        name: string;
    };
    base_amount: number;
    tax_amount: number;
    tip_amount: number;
    total_owed: number;
}

export interface ShareInput {
    userId: string;
    amount: string;
}


