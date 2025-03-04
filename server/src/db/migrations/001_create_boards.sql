-- Create boards table
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create board_members table for many-to-many relationship
CREATE TABLE board_members (
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

-- Create columns table
CREATE TABLE columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    values JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Boards policies
CREATE POLICY "Users can view boards they own or are members of"
    ON boards FOR SELECT
    USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM board_members
            WHERE board_members.board_id = boards.id
            AND board_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create boards"
    ON boards FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update boards they own"
    ON boards FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete boards they own"
    ON boards FOR DELETE
    USING (auth.uid() = owner_id);

-- Board members policies
CREATE POLICY "Users can view board members"
    ON board_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = board_members.board_id
            AND (boards.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM board_members bm
                    WHERE bm.board_id = boards.id
                    AND bm.user_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Board owners can add members"
    ON board_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = board_members.board_id
            AND boards.owner_id = auth.uid()
        )
    );

CREATE POLICY "Board owners can remove members"
    ON board_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = board_members.board_id
            AND boards.owner_id = auth.uid()
        )
    );

-- Columns policies
CREATE POLICY "Users can view columns of boards they have access to"
    ON columns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = columns.board_id
            AND (boards.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM board_members
                    WHERE board_members.board_id = boards.id
                    AND board_members.user_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Users can create columns in boards they own"
    ON columns FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = columns.board_id
            AND boards.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update columns in boards they own"
    ON columns FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = columns.board_id
            AND boards.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete columns in boards they own"
    ON columns FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = columns.board_id
            AND boards.owner_id = auth.uid()
        )
    );

-- Groups policies
CREATE POLICY "Users can view groups of boards they have access to"
    ON groups FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = groups.board_id
            AND (boards.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM board_members
                    WHERE board_members.board_id = boards.id
                    AND board_members.user_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Users can create groups in boards they own"
    ON groups FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = groups.board_id
            AND boards.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update groups in boards they own"
    ON groups FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = groups.board_id
            AND boards.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete groups in boards they own"
    ON groups FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = groups.board_id
            AND boards.owner_id = auth.uid()
        )
    );

-- Items policies
CREATE POLICY "Users can view items of boards they have access to"
    ON items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = items.board_id
            AND (boards.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM board_members
                    WHERE board_members.board_id = boards.id
                    AND board_members.user_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Users can create items in boards they have access to"
    ON items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = items.board_id
            AND (boards.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM board_members
                    WHERE board_members.board_id = boards.id
                    AND board_members.user_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Users can update items in boards they have access to"
    ON items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = items.board_id
            AND (boards.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM board_members
                    WHERE board_members.board_id = boards.id
                    AND board_members.user_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Users can delete items in boards they have access to"
    ON items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = items.board_id
            AND (boards.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM board_members
                    WHERE board_members.board_id = boards.id
                    AND board_members.user_id = auth.uid()
                ))
        )
    );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_columns_updated_at
    BEFORE UPDATE ON columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 