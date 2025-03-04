import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      title
      description
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
      items {
        id
        title
        groupId
        values {
          columnId
          value
        }
        assigneeIds
        tagIds
      }
    }
  }
`;

const CREATE_ITEM = gql`
  mutation CreateItem($boardId: ID!, $title: String!, $groupId: ID!) {
    createItem(boardId: $boardId, title: $title, groupId: $groupId) {
      id
      title
      groupId
      values {
        columnId
        value
      }
      assigneeIds
      tagIds
    }
  }
`;

const UPDATE_ITEM = gql`
  mutation UpdateItem($id: ID!, $input: UpdateItemInput!) {
    updateItem(id: $id, input: $input) {
      id
      title
      groupId
      values {
        columnId
        value
      }
      assigneeIds
      tagIds
    }
  }
`;

interface Item {
  id: string;
  title: string;
  groupId: string;
  values: Array<{
    columnId: string;
    value: any;
  }>;
  assigneeIds: string[];
  tagIds: string[];
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
  settings: Record<string, any>;
}

interface Board {
  id: string;
  title: string;
  description: string;
  columns: Column[];
  groups: Group[];
  items: Item[];
}

export const Board: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const { loading, error, data, refetch } = useQuery(GET_BOARD, {
    variables: { id: boardId },
  });
  const [createItem] = useMutation(CREATE_ITEM, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: boardId } }],
  });
  const [updateItem] = useMutation(UPDATE_ITEM, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: boardId } }],
  });

  useEffect(() => {
    if (data?.board) {
      // Set up real-time updates using Socket.IO
      const socket = new WebSocket(`ws://localhost:4000/board/${boardId}`);
      socket.onmessage = (event) => {
        const update = JSON.parse(event.data);
        // Handle real-time updates
      };
      return () => socket.close();
    }
  }, [boardId, data]);

  const handleCreateItem = async () => {
    if (!selectedGroup) return;
    try {
      await createItem({
        variables: {
          boardId,
          title,
          groupId: selectedGroup,
        },
      });
      setOpen(false);
      setTitle('');
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) {
      // Reorder within the same group
      // Implement reordering logic
    } else {
      // Move to a different group
      try {
        await updateItem({
          variables: {
            id: draggableId,
            input: {
              groupId: destination.droppableId,
            },
          },
        });
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading board</div>;

  const board: Board = data.board;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {board.title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Item
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2}>
          {board.groups.map((group) => (
            <Grid item xs={12} md={4} key={group.id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {group.title}
                </Typography>
                <Droppable droppableId={group.id}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {group.itemIds.map((itemId, index) => {
                        const item = board.items.find((i) => i.id === itemId);
                        if (!item) return null;

                        return (
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
                                sx={{ p: 2, mb: 1 }}
                              >
                                <Typography variant="subtitle1">
                                  {item.title}
                                </Typography>
                                {board.columns.map((column) => {
                                  const value = item.values.find(
                                    (v) => v.columnId === column.id
                                  );
                                  return (
                                    <Typography
                                      key={column.id}
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {column.title}: {value?.value || '-'}
                                    </Typography>
                                  );
                                })}
                              </Paper>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            select
            margin="dense"
            label="Group"
            fullWidth
            value={selectedGroup || ''}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {board.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateItem} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 