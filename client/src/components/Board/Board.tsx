import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';
import { supabase } from '../../lib/supabase';

// GraphQL queries and mutations
const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      title
      description
      ownerId
      memberIds
      columns {
        id
        title
        type
        settings
      }
      groups {
        id
        title
        itemIds
      }
    }
    items(boardId: $id) {
      id
      title
      description
      values
      groupId
      createdBy
      updatedBy
    }
  }
`;

const CREATE_ITEM = gql`
  mutation CreateItem(
    $boardId: ID!
    $groupId: ID!
    $title: String!
    $description: String
    $values: JSON
  ) {
    createItem(
      boardId: $boardId
      groupId: $groupId
      title: $title
      description: $description
      values: $values
    ) {
      id
      title
      description
      values
      groupId
      createdBy
      updatedBy
    }
  }
`;

const MOVE_ITEM = gql`
  mutation MoveItem($id: ID!, $groupId: ID!) {
    moveItem(id: $id, groupId: $groupId) {
      id
      groupId
    }
  }
`;

interface Item {
  id: string;
  title: string;
  description?: string;
  values?: Record<string, any>;
  groupId: string;
  createdBy: string;
  updatedBy: string;
}

interface Group {
  id: string;
  title: string;
  itemIds: string[];
}

interface Column {
  id: string;
  title: string;
  type: string;
  settings?: Record<string, any>;
}

interface Board {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  columns: Column[];
  groups: Group[];
}

export const Board: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { loading, error, data } = useQuery(GET_BOARD, {
    variables: { id },
  });

  const [createItem] = useMutation(CREATE_ITEM, {
    refetchQueries: [{ query: GET_BOARD, variables: { id } }],
  });

  const [moveItem] = useMutation(MOVE_ITEM, {
    refetchQueries: [{ query: GET_BOARD, variables: { id } }],
  });

  useEffect(() => {
    if (!id) return;

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`board:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `board_id=eq.${id}`,
        },
        (payload) => {
          // Refetch board data when changes occur
          refetch();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const sourceGroupId = result.source.droppableId;
    const destinationGroupId = destination.droppableId;

    if (sourceGroupId === destinationGroupId) return;

    try {
      await moveItem({
        variables: {
          id: draggableId,
          groupId: destinationGroupId,
        },
      });
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedGroup || !newItemTitle.trim()) return;

    try {
      await createItem({
        variables: {
          boardId: id,
          groupId: selectedGroup,
          title: newItemTitle,
        },
      });
      setNewItemTitle('');
      setIsAddItemDialogOpen(false);
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error: {error.message}</Typography>;
  if (!data?.board) return <Typography>Board not found</Typography>;

  const { board, items } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{board.title}</Typography>
        <Box>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddItemDialogOpen(true)}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {board.groups.map((group) => (
            <Paper
              key={group.id}
              sx={{
                minWidth: 300,
                p: 2,
                bgcolor: theme.palette.grey[100],
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{group.title}</Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedGroup(group.id);
                    setIsAddItemDialogOpen(true);
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              <Droppable droppableId={group.id}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ minHeight: 100 }}
                  >
                    {items
                      .filter((item: Item) => item.groupId === group.id)
                      .map((item: Item, index: number) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                        >
                          {(provided) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                p: 2,
                                mb: 1,
                                bgcolor: 'white',
                                '&:hover': {
                                  boxShadow: theme.shadows[2],
                                },
                              }}
                            >
                              <Typography variant="subtitle1">
                                {item.title}
                              </Typography>
                              {item.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 1 }}
                                >
                                  {item.description}
                                </Typography>
                              )}
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          ))}
        </Box>
      </DragDropContext>

      <Dialog
        open={isAddItemDialogOpen}
        onClose={() => setIsAddItemDialogOpen(false)}
      >
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddItemDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 